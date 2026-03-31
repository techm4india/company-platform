import "dotenv/config";
import { buildServer } from "./server";

async function main() {
  const app = await buildServer();

  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  for (const s of signals) {
    process.on(s, async () => {
      try {
        await app.close();
      } finally {
        process.exit(0);
      }
    });
  }

  await app.listen({ port: app.config.PORT, host: app.config.HOST });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

