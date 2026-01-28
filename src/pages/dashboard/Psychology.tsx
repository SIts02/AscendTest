import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { AchievementsList } from '@/components/psychology/AchievementsList';

export default function Psychology() {
    return (
        <DashboardLayout activePage="Gamification">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Conquistas e Desafios</h1>
                    <p className="text-muted-foreground">
                        Acompanhe seu progresso e desbloqueie conquistas
                    </p>
                </div>

                <AchievementsList />
            </div>
        </DashboardLayout>
    );
}