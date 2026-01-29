
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS psychological_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    archetype TEXT NOT NULL DEFAULT 'descobridor',
    archetype_scores JSONB DEFAULT '{}',

    risk_tolerance INTEGER DEFAULT 5,
    spending_impulse INTEGER DEFAULT 5,
    saving_discipline INTEGER DEFAULT 5,
    goal_orientation INTEGER DEFAULT 5,

    prefers_challenges BOOLEAN DEFAULT TRUE,
    prefers_nudges BOOLEAN DEFAULT TRUE,
    nudge_frequency TEXT DEFAULT 'moderate',

    primary_motivator TEXT DEFAULT 'security',

    last_quiz_at TIMESTAMPTZ,
    confidence_score INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_psychological_profiles_user_id ON psychological_profiles(user_id);

CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,

    requirement_type TEXT NOT NULL,
    requirement_value NUMERIC,

    points INTEGER DEFAULT 0,
    badge_tier TEXT DEFAULT 'bronze',
    badge_icon TEXT,

    is_secret BOOLEAN DEFAULT FALSE,
    required_plan TEXT,

    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,

    progress NUMERIC DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
   completed_at TIMESTAMPTZ,

    notified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(is_completed, user_id);

CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT DEFAULT 'medium',

    duration_days INTEGER NOT NULL,

    goal_type TEXT NOT NULL,
    goal_value NUMERIC,
    goal_metadata JSONB DEFAULT '{}',

    points INTEGER DEFAULT 0,
    achievement_id UUID REFERENCES achievements(id),

    recommended_archetypes TEXT[],
    min_tier TEXT,

    is_active BOOLEAN DEFAULT TRUE,
    is_recurring BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES challenges(id),

    started_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ NOT NULL,

    current_value NUMERIC DEFAULT 0,
    target_value NUMERIC NOT NULL,
    progress_percentage INTEGER DEFAULT 0,

    status TEXT DEFAULT 'active',
    completed_at TIMESTAMPTZ,

    points_earned INTEGER DEFAULT 0,

    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON user_challenges(status, user_id);

CREATE TABLE IF NOT EXISTS behavioral_nudges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    cta_text TEXT,
    cta_url TEXT,

    trigger_type TEXT NOT NULL,
    trigger_metadata JSONB DEFAULT '{}',

    priority INTEGER DEFAULT 0,

    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    action_taken_at TIMESTAMPTZ,

    was_effective BOOLEAN,
    feedback TEXT,

    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behavioral_nudges_user_id ON behavioral_nudges(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_nudges_delivered ON behavioral_nudges(delivered_at, user_id);

CREATE OR REPLACE FUNCTION get_user_achievement_points(
    p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_total_points INTEGER := 0;
BEGIN
    SELECT COALESCE(SUM(a.points), 0) INTO v_total_points
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = p_user_id
      AND ua.is_completed = TRUE;

    RETURN v_total_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_achievements(
    p_user_id UUID,
    p_category TEXT
) RETURNS JSONB AS $$
DECLARE
    v_new_achievements JSONB := '[]'::jsonb;
    v_achievement RECORD;
BEGIN

    FOR v_achievement IN
        SELECT a.*
        FROM achievements a
        WHERE a.category = p_category
          AND a.is_active = TRUE
          AND NOT EXISTS (
              SELECT 1 FROM user_achievements ua
              WHERE ua.user_id = p_user_id
                AND ua.achievement_id = a.id
                AND ua.is_completed = TRUE
          )
    LOOP

        NULL;
    END LOOP;

    RETURN v_new_achievements;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_challenge_progress(
    p_user_challenge_id UUID,
    p_new_value NUMERIC
) RETURNS VOID AS $$
DECLARE
    v_target NUMERIC;
BEGIN

    UPDATE user_challenges
    SET
        current_value = p_new_value,
        progress_percentage = LEAST(100, ROUND((p_new_value / target_value) * 100)),
        status = CASE
            WHEN p_new_value >= target_value THEN 'completed'
            WHEN NOW() > ends_at THEN 'failed'
            ELSE status
        END,
        completed_at = CASE
            WHEN p_new_value >= target_value AND completed_at IS NULL THEN NOW()
            ELSE completed_at
        END,
        updated_at = NOW()
    WHERE id = p_user_challenge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE psychological_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON psychological_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON psychological_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own challenges"
    ON user_challenges FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges"
    ON user_challenges FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own nudges"
    ON behavioral_nudges FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own nudges"
    ON behavioral_nudges FOR UPDATE
    USING (auth.uid() = user_id);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements are viewable by everyone"
    ON achievements FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Challenges are viewable by everyone"
    ON challenges FOR SELECT
    USING (is_active = TRUE);

CREATE TRIGGER update_psychological_profiles_updated_at
    BEFORE UPDATE ON psychological_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_achievements_updated_at
    BEFORE UPDATE ON user_achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_challenges_updated_at
    BEFORE UPDATE ON user_challenges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

INSERT INTO achievements (code, name, description, category, requirement_type, requirement_value, points, badge_tier) VALUES
('first_budget', 'Primeiro Orçamento', 'Criou seu primeiro orçamento mensal', 'budget', 'count', 1, 10, 'bronze'),
('budget_streak_7', 'Semana Disciplinada', 'Manteve o orçamento por 7 dias seguidos', 'budget', 'streak', 7, 25, 'silver'),
('first_goal', 'Meta Definida', 'Criou sua primeira meta financeira', 'goals', 'count', 1, 10, 'bronze'),
('goal_achieved', 'Objetivo Alcançado', 'Atingiu uma meta financeira', 'goals', 'milestone', 1, 50, 'gold'),
('transactions_100', 'Organizador', 'Registrou 100 transações', 'transactions', 'count', 100, 30, 'silver'),
('saving_1000', 'Economizador', 'Economizou R$ 1.000', 'savings', 'value', 1000, 40, 'gold'),
('forecast_created', 'Visionário', 'Criou primeira projeção financeira', 'forecast', 'count', 1, 15, 'bronze');