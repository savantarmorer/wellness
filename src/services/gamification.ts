import { notificationService } from './notifications';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (stats: UserStats) => boolean;
  reward?: string;
  isUnlocked?: boolean;
}

interface UserStats {
  assessmentStreak: number;
  totalAssessments: number;
  weeklyCompletionRate: number;
  improvingCategories: string[];
  partnerSyncRate: number;
}

class GamificationService {
  private static instance: GamificationService;
  private achievements: Achievement[] = [
    {
      id: 'first-assessment',
      title: 'First Step',
      description: 'Complete your first daily assessment',
      icon: '🌟',
      condition: (stats) => stats.totalAssessments >= 1,
    },
    {
      id: 'week-streak',
      title: 'Week Warrior',
      description: 'Complete assessments for 7 consecutive days',
      icon: '🔥',
      condition: (stats) => stats.assessmentStreak >= 7,
    },
    {
      id: 'month-streak',
      title: 'Dedication Master',
      description: 'Complete assessments for 30 consecutive days',
      icon: '👑',
      condition: (stats) => stats.assessmentStreak >= 30,
    },
    {
      id: 'perfect-week',
      title: 'Perfect Harmony',
      description: 'Achieve 100% completion rate for a week',
      icon: '🎯',
      condition: (stats) => stats.weeklyCompletionRate === 100,
    },
    {
      id: 'improvement-champion',
      title: 'Growth Champion',
      description: 'Show improvement in 3 or more categories',
      icon: '📈',
      condition: (stats) => stats.improvingCategories.length >= 3,
    },
    {
      id: 'sync-master',
      title: 'Sync Master',
      description: 'Achieve 90% partner sync rate',
      icon: '🤝',
      condition: (stats) => stats.partnerSyncRate >= 90,
    },
  ];

  private userAchievements: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): GamificationService {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService();
    }
    return GamificationService.instance;
  }

  public async checkAchievements(stats: UserStats): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];

    for (const achievement of this.achievements) {
      if (
        !this.userAchievements.has(achievement.id) &&
        achievement.condition(stats)
      ) {
        this.userAchievements.add(achievement.id);
        newAchievements.push(achievement);
        await this.notifyAchievement(achievement);
      }
    }

    return newAchievements;
  }

  private async notifyAchievement(achievement: Achievement) {
    await notificationService.showMilestone(
      `Achievement Unlocked: ${achievement.title}! ${achievement.description}`
    );
  }

  public getAchievements(): Achievement[] {
    return this.achievements.map((achievement) => ({
      ...achievement,
      isUnlocked: this.userAchievements.has(achievement.id),
    }));
  }

  public getUserStats(assessments: any[]): UserStats {
    // Calculate user statistics based on assessment history
    const stats: UserStats = {
      assessmentStreak: this.calculateStreak(assessments),
      totalAssessments: assessments.length,
      weeklyCompletionRate: this.calculateWeeklyCompletionRate(assessments),
      improvingCategories: this.calculateImprovingCategories(assessments),
      partnerSyncRate: this.calculatePartnerSyncRate(assessments),
    };

    return stats;
  }

  private calculateStreak(assessments: any[]): number {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < assessments.length; i++) {
      const assessmentDate = new Date(assessments[i].date);
      assessmentDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (assessmentDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private calculateWeeklyCompletionRate(assessments: any[]): number {
    const lastWeek = assessments.filter((assessment) => {
      const assessmentDate = new Date(assessment.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return assessmentDate >= weekAgo;
    });

    return (lastWeek.length / 7) * 100;
  }

  private calculateImprovingCategories(assessments: any[]): string[] {
    const categories = ['communication', 'anxiety', 'transparency', 'intimacy', 'insecurity'];
    const improvingCategories: string[] = [];

    // Need at least 3 assessments to determine improvement
    if (assessments.length < 3) {
      return improvingCategories;
    }

    categories.forEach((category) => {
      const values = assessments
        .slice(0, 3)
        .map((assessment) => assessment.ratings[category])
        .reverse(); // Most recent first

      if (values[0] > values[1] && values[1] > values[2]) {
        improvingCategories.push(category);
      }
    });

    return improvingCategories;
  }

  private calculatePartnerSyncRate(assessments: any[]): number {
    const syncedAssessments = assessments.filter(
      (assessment) => assessment.partnerId
    );
    return (syncedAssessments.length / assessments.length) * 100;
  }

  public getLevel(totalAssessments: number): number {
    // Simple level calculation based on total assessments
    return Math.floor(totalAssessments / 10) + 1;
  }

  public getNextLevelProgress(totalAssessments: number): number {
    // Calculate progress to next level (0-100)
    const currentLevel = this.getLevel(totalAssessments);
    const assessmentsForCurrentLevel = (currentLevel - 1) * 10;
    const progressToNextLevel = totalAssessments - assessmentsForCurrentLevel;
    return (progressToNextLevel / 10) * 100;
  }
}

// Create and export a singleton instance
export const gamificationService = GamificationService.getInstance(); 