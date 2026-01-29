import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAchievements } from '@/hooks/useAchievements';
import { Trophy, Award, Star, Crown, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AchievementsList() {
    const { allAchievements, userAchievements, totalPoints, completedCount, completionRate } = useAchievements();

    const getBadgeIcon = (tier: string) => {
        switch (tier) {
            case 'bronze':
                return <Award className="h-5 w-5 text-orange-600" />;
            case 'silver':
                return <Star className="h-5 w-5 text-gray-400" />;
            case 'gold':
                return <Trophy className="h-5 w-5 text-yellow-500" />;
            case 'platinum':
                return <Crown className="h-5 w-5 text-purple-500" />;
            default:
                return <Award className="h-5 w-5" />;
        }
    };

    const getUserProgress = (achievementId: string) => {
        return userAchievements.find((ua) => ua.achievement_id === achievementId);
    };

    return (
        <div className="space-y-6">
            {}
            <Card>
                <CardHeader>
                    <CardTitle>Conquistas</CardTitle>
                    <CardDescription>
                        {completedCount} de {allAchievements.length} desbloqueadas
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <span className="font-bold text-2xl">{totalPoints}</span>
                            <span className="text-muted-foreground">pontos</span>
                        </div>
                        <Badge variant="secondary">{Math.round(completionRate)}% completo</Badge>
                    </div>
                    <Progress value={completionRate} />
                </CardContent>
            </Card>

            {}
            <div className="grid gap-4">
                {allAchievements.map((achievement) => {
                    const userProgress = getUserProgress(achievement.id);
                    const isCompleted = userProgress?.is_completed || false;
                    const progress = userProgress?.progress || 0;

                    return (
                        <Card
                            key={achievement.id}
                            className={`${isCompleted
                                    ? 'border-primary bg-primary/5'
                                    : achievement.is_secret && !userProgress
                                        ? 'opacity-50'
                                        : ''
                                }`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    {}
                                    <div
                                        className={`h-14 w-14 rounded-full flex items-center justify-center ${isCompleted
                                                ? 'bg-primary/10'
                                                : 'bg-muted'
                                            }`}
                                    >
                                        {achievement.is_secret && !userProgress ? (
                                            <Lock className="h-6 w-6 text-muted-foreground" />
                                        ) : (
                                            getBadgeIcon(achievement.badge_tier)
                                        )}
                                    </div>

                                    {}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold">
                                                {achievement.is_secret && !userProgress ? '???' : achievement.name}
                                            </h4>
                                            <Badge variant="outline" className="text-xs">
                                                {achievement.points} pts
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {achievement.is_secret && !userProgress
                                                ? 'Conquista secreta - continue explorando para desbloquear'
                                                : achievement.description}
                                        </p>

                                        {}
                                        {userProgress && !isCompleted && achievement.requirement_value && (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>Progresso</span>
                                                    <span>
                                                        {progress} / {achievement.requirement_value}
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={(progress / achievement.requirement_value) * 100}
                                                    className="h-2"
                                                />
                                            </div>
                                        )}

                                        {}
                                        {isCompleted && userProgress.completed_at && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Desbloqueado em{' '}
                                                {format(new Date(userProgress.completed_at), 'dd/MM/yyyy', {
                                                    locale: ptBR,
                                                })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}