import { createMutator } from "@vulcanjs/crud/server";
import { User, UserMongooseModel } from "~/account/models/user.server";

const seed = async (context) => {
  if (process.env.MONGO_URI?.match(/lbke-demo/)) {
    console.log("Using demo database, skip seeding");
    return;
  }
  // Add your seed functions here based on the example of users

  const seedAdminUser = async () => {
    // FIXME: the isAdmin: true filter seems ignored for unknown version
    const count = await UserMongooseModel.count({ isAdmin: true });
    if (count === 0) {
      console.log("No admin user found, seeding admin");
      if (!process.env.ADMIN_EMAIL) {
        throw new Error(
          "ADMIN_EMAIL env variable not defined. Could not seed admin user"
        );
      }
      if (!process.env.ADMIN_INITIAL_PASSWORD) {
        throw new Error(
          "ADMIN_INITIAL_PASSWORD env variable not defined. Could not seed admin user."
        );
      }
      const admin = {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_INITIAL_PASSWORD,
        isAdmin: true,
      };
      try {
        await createMutator({
          model: User,
          data: admin,
          context,
          asAdmin: true,
          validate: false,
        });
      } catch (error) {
        console.error("Could not seed admin user", error);
      }
    } else {
      console.log(`Found ${count} Admin(s) in the database, no need to seed.`);
    }
  };

  // Run the seed functions
  await seedAdminUser();
};

export default seed;
