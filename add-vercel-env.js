const https = require("node:https");

const TOKEN = "vca_210qY40iPptiAmHfhjKLHdAE70v9PyjS8E0hnk44WaKqgc8wLZ42i1hr";
const PROJECT_ID = "prj_XXRRY66V8Dc3ZAu2ENv3lBm3umFm";
const TEAM_ID = "team_kEw4gDRILHd86jI3JMMuiVrd";

const ALL_TARGETS = ["production", "preview", "development"];

const envVars = [
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    value: "https://hzyjnrbzanquehqhzbla.supabase.co",
    type: "plain",
    target: ALL_TARGETS,
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    value:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6eWpucmJ6YW5xdWVocWh6YmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTk5MTgsImV4cCI6MjA4Nzg3NTkxOH0.gZ6MMU7Nsf6RdXyXrZOBUpcpYLA4iB3UfBGEsZYv3h0",
    type: "encrypted",
    target: ALL_TARGETS,
  },
  {
    key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    value:
      "pk_test_51T01bXRpzFVVguPZ5WQRzkGEZe8tNcQKdH5lZ3B2jYBLnnUhFcBNwxLhoRweJ03zJFYkbroShqPMe2K9zV2CNXEZ00NR1ic9Bj",
    type: "encrypted",
    target: ALL_TARGETS,
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    value: "https://snapstage.vercel.app",
    type: "plain",
    target: ["production", "preview"],
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    value: "http://localhost:3000",
    type: "plain",
    target: ["development"],
  },
  {
    key: "NEXT_PUBLIC_API_URL",
    value: "http://localhost:4000",
    type: "plain",
    target: ALL_TARGETS,
  },
];

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : "";
    const options = {
      hostname: "api.vercel.com",
      path: `${path}?teamId=${TEAM_ID}`,
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });

    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log("Fetching existing env vars...");
  const listRes = await request("GET", `/v9/projects/${PROJECT_ID}/env`);
  if (listRes.status !== 200) {
    console.error("Failed to list env vars:", JSON.stringify(listRes.body));
    process.exit(1);
  }
  const existing = listRes.body.envs || [];
  console.log(`Found ${existing.length} existing env vars.\n`);

  for (const envVar of envVars) {
    // Delete any existing entries for this key to allow clean re-creation
    const matches = existing.filter((e) => e.key === envVar.key);
    for (const match of matches) {
      await request("DELETE", `/v9/projects/${PROJECT_ID}/env/${match.id}`);
    }

    // Create new entry
    const res = await request("POST", `/v10/projects/${PROJECT_ID}/env`, [
      envVar,
    ]);

    if (res.status === 200 || res.status === 201) {
      console.log(`✅  ${envVar.key} → [${envVar.target.join(", ")}]`);
    } else {
      console.log(
        `❌  ${envVar.key} → ${res.status}:`,
        JSON.stringify(res.body),
      );
    }
  }

  console.log("\n✅  All environment variables set!");
  console.log("   Trigger a new Vercel deployment to apply them.");
}

void main();
