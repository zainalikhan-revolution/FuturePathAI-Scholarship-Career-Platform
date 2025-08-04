async function handler({ scholarship_id }) {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Not authenticated" };
  }

  if (!scholarship_id) {
    return { error: "Scholarship ID is required" };
  }

  try {
    const result = await sql`
      DELETE FROM user_favorites 
      WHERE user_id = ${session.user.id} AND scholarship_id = ${scholarship_id}
      RETURNING id
    `;

    if (result.length === 0) {
      return { error: "Scholarship not found in favorites" };
    }

    return {
      success: true,
      message: "Scholarship removed from favorites",
    };
  } catch (error) {
    console.error("Error removing favorite:", error);
    return { error: "Failed to remove scholarship from favorites" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}