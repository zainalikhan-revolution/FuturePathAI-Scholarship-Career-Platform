async function handler({
  scholarship_id,
  scholarship_title,
  scholarship_provider,
  scholarship_country,
  scholarship_deadline,
  scholarship_amount,
  scholarship_level,
  scholarship_field,
}) {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Not authenticated" };
  }

  if (!scholarship_id || !scholarship_title) {
    return { error: "Scholarship ID and title are required" };
  }

  try {
    const existingFavorite = await sql`
      SELECT id FROM user_favorites 
      WHERE user_id = ${session.user.id} AND scholarship_id = ${scholarship_id}
    `;

    if (existingFavorite.length > 0) {
      return { error: "Scholarship already in favorites" };
    }

    const result = await sql`
      INSERT INTO user_favorites (
        user_id, 
        scholarship_id, 
        scholarship_title, 
        scholarship_provider, 
        scholarship_country, 
        scholarship_deadline, 
        scholarship_amount, 
        scholarship_level, 
        scholarship_field
      ) VALUES (
        ${session.user.id},
        ${scholarship_id},
        ${scholarship_title},
        ${scholarship_provider || null},
        ${scholarship_country || null},
        ${scholarship_deadline || null},
        ${scholarship_amount || null},
        ${scholarship_level || null},
        ${scholarship_field || null}
      )
      RETURNING id
    `;

    return {
      success: true,
      message: "Scholarship added to favorites",
      favorite_id: result[0].id,
    };
  } catch (error) {
    console.error("Error adding favorite:", error);
    return { error: "Failed to add scholarship to favorites" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}