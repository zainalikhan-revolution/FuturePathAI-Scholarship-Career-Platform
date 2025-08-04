async function handler({
  goal_title,
  goal_description,
  target_field,
  target_country,
  target_degree_level,
  target_completion_date,
}) {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Not authenticated" };
  }

  if (!goal_title) {
    return { error: "Goal title is required" };
  }

  try {
    const result = await sql`
      INSERT INTO user_career_goals (
        user_id,
        goal_title,
        goal_description,
        target_field,
        target_country,
        target_degree_level,
        target_completion_date,
        current_status,
        progress_percentage
      ) VALUES (
        ${session.user.id},
        ${goal_title},
        ${goal_description || null},
        ${target_field || null},
        ${target_country || null},
        ${target_degree_level || null},
        ${target_completion_date || null},
        'planning',
        0
      )
      RETURNING id, goal_title, created_at
    `;

    return {
      success: true,
      message: "Career goal created successfully",
      goal: result[0],
    };
  } catch (error) {
    console.error("Error creating career goal:", error);
    return { error: "Failed to create career goal" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}