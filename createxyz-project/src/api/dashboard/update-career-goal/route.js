async function handler({ goal_id, progress_percentage, current_status }) {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Not authenticated" };
  }

  if (!goal_id) {
    return { error: "Goal ID is required" };
  }

  if (
    progress_percentage !== undefined &&
    (progress_percentage < 0 || progress_percentage > 100)
  ) {
    return { error: "Progress percentage must be between 0 and 100" };
  }

  try {
    const setClauses = [];
    const values = [];
    let paramCount = 0;

    if (progress_percentage !== undefined) {
      setClauses.push(`progress_percentage = $${++paramCount}`);
      values.push(progress_percentage);
    }

    if (current_status) {
      setClauses.push(`current_status = $${++paramCount}`);
      values.push(current_status);
    }

    if (setClauses.length === 0) {
      return { error: "No fields to update" };
    }

    setClauses.push(`updated_at = $${++paramCount}`);
    values.push(new Date());

    const query = `
      UPDATE user_career_goals 
      SET ${setClauses.join(", ")}
      WHERE id = $${++paramCount} AND user_id = $${++paramCount}
      RETURNING id, goal_title, progress_percentage, current_status, updated_at
    `;

    values.push(goal_id, session.user.id);

    const result = await sql(query, values);

    if (result.length === 0) {
      return { error: "Career goal not found or access denied" };
    }

    return {
      success: true,
      message: "Career goal updated successfully",
      goal: result[0],
    };
  } catch (error) {
    console.error("Error updating career goal:", error);
    return { error: "Failed to update career goal" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}