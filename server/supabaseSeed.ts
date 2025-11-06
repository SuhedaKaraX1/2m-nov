import { supabase } from "./supabase";
import { challengeSeedData, achievementSeedData } from "./storage";

export async function seedSupabaseDatabase() {
  try {
    // Seed challenges
    const { data: existingChallenges, error: challengeCheckError } = await supabase
      .from('challenges')
      .select('id')
      .limit(1);

    if (!existingChallenges || existingChallenges.length === 0) {
      console.log("Seeding Supabase with challenges...");
      
      const challengesToInsert = challengeSeedData.map(c => ({
        title: c.title,
        description: c.description,
        category: c.category,
        subcategory: c.subcategory,
        difficulty: c.difficulty,
        points: c.points,
        instructions: c.instructions,
        created_by: null,
      }));

      const { error } = await supabase
        .from('challenges')
        .insert(challengesToInsert);

      if (error) {
        console.error("Error seeding challenges:", error);
      } else {
        console.log(`Successfully seeded ${challengesToInsert.length} challenges`);
      }
    } else {
      console.log("Database already seeded with challenges");
    }

    // Seed achievements
    const { data: existingAchievements, error: achievementCheckError } = await supabase
      .from('achievements')
      .select('id')
      .limit(1);

    if (!existingAchievements || existingAchievements.length === 0) {
      console.log("Seeding Supabase with achievements...");
      
      const achievementsToInsert = achievementSeedData.map((a: any) => ({
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
        requirement_type: a.requirementType,
        requirement_value: a.requirementValue,
        requirement_meta: a.requirementMeta,
        tier: a.tier,
        sort_order: a.sortOrder,
      }));

      const { error } = await supabase
        .from('achievements')
        .insert(achievementsToInsert);

      if (error) {
        console.error("Error seeding achievements:", error);
      } else {
        console.log(`Successfully seeded ${achievementsToInsert.length} achievements`);
      }
    } else {
      console.log("Database already seeded with achievements");
    }
  } catch (error) {
    console.error("Error seeding Supabase database:", error);
  }
}
