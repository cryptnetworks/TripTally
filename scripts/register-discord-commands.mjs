const token = process.env.DISCORD_BOT_TOKEN;
const applicationId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !applicationId) {
  throw new Error("DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID are required.");
}

const commands = [
  { name: "link", description: "Link your Discord account to TripTally" },
  {
    name: "trip",
    description: "Manage TripTally trips",
    options: [
      {
        type: 1,
        name: "create",
        description: "Create a trip",
        options: [
          { type: 3, name: "name", description: "Trip name", required: true },
          {
            type: 3,
            name: "description",
            description: "Optional destination or description",
            required: false
          }
        ]
      },
      { type: 1, name: "list", description: "List your trips" },
      {
        type: 1,
        name: "summary",
        description: "Show a trip summary",
        options: [{ type: 3, name: "trip", description: "Trip name", required: true }]
      }
    ]
  }
];

const route = guildId
  ? `applications/${applicationId}/guilds/${guildId}/commands`
  : `applications/${applicationId}/commands`;

const response = await fetch(`https://discord.com/api/v10/${route}`, {
  method: "PUT",
  headers: {
    authorization: `Bot ${token}`,
    "content-type": "application/json"
  },
  body: JSON.stringify(commands)
});

if (!response.ok) {
  throw new Error(
    `Discord command registration failed: ${response.status} ${await response.text()}`
  );
}

console.log(`Registered ${commands.length} Discord command groups.`);
