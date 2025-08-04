async function handler({ user_id }) {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Not authenticated" };
  }

  const userId = user_id || session.user.id;

  if (!userId) {
    return { error: "User ID required" };
  }

  try {
    const [userProfile, favorites, careerGoals] = await sql.transaction([
      sql`SELECT * FROM user_profiles WHERE user_id = ${userId}`,
      sql`SELECT * FROM user_favorites WHERE user_id = ${userId} ORDER BY created_at DESC`,
      sql`SELECT * FROM user_career_goals WHERE user_id = ${userId} ORDER BY created_at DESC`,
    ]);

    return {
      profile: userProfile[0] || null,
      favorites: favorites || [],
      careerGoals: careerGoals || [],
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return { error: "Failed to fetch dashboard data" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}