const skillId = process.env.SKILL_ID;

if (!skillId) {
    throw new Error('SKILL_ID environment variable is required.');
}

export const SKILL_ID = skillId;
