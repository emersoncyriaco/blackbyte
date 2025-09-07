var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  attachments: () => attachments,
  attachmentsRelations: () => attachmentsRelations,
  forums: () => forums,
  forumsRelations: () => forumsRelations,
  insertAttachmentSchema: () => insertAttachmentSchema,
  insertForumSchema: () => insertForumSchema,
  insertPostSchema: () => insertPostSchema,
  insertReplySchema: () => insertReplySchema,
  insertUserSchema: () => insertUserSchema,
  posts: () => posts,
  postsRelations: () => postsRelations,
  replies: () => replies,
  repliesRelations: () => repliesRelations,
  sessions: () => sessions,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("membro"),
  // membro, vip, moderador, admin
  banned: boolean("banned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var forums = pgTable("forums", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon").notNull(),
  color: varchar("color").notNull(),
  slug: varchar("slug").notNull().unique(),
  postCount: integer("post_count").default(0),
  viewCount: integer("view_count").default(0),
  order: integer("order").default(0),
  requiresRole: varchar("requires_role").default("membro"),
  // minimum role required
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  forumId: varchar("forum_id").notNull().references(() => forums.id),
  viewCount: integer("view_count").default(0),
  replyCount: integer("reply_count").default(0),
  pinned: boolean("pinned").default(false),
  locked: boolean("locked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var attachments = pgTable("attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id),
  fileName: varchar("file_name").notNull(),
  fileUrl: varchar("file_url").notNull(),
  fileType: varchar("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var replies = pgTable("replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  postId: varchar("post_id").notNull().references(() => posts.id),
  parentReplyId: varchar("parent_reply_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  replies: many(replies)
}));
var forumsRelations = relations(forums, ({ many }) => ({
  posts: many(posts)
}));
var postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id]
  }),
  forum: one(forums, {
    fields: [posts.forumId],
    references: [forums.id]
  }),
  attachments: many(attachments),
  replies: many(replies)
}));
var attachmentsRelations = relations(attachments, ({ one }) => ({
  post: one(posts, {
    fields: [attachments.postId],
    references: [posts.id]
  })
}));
var repliesRelations = relations(replies, ({ one, many }) => ({
  author: one(users, {
    fields: [replies.authorId],
    references: [users.id]
  }),
  post: one(posts, {
    fields: [replies.postId],
    references: [posts.id]
  }),
  parentReply: one(replies, {
    fields: [replies.parentReplyId],
    references: [replies.id]
  }),
  childReplies: many(replies)
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertForumSchema = createInsertSchema(forums).omit({
  id: true,
  postCount: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true
});
var insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  viewCount: true,
  replyCount: true,
  createdAt: true,
  updatedAt: true
});
var insertReplySchema = createInsertSchema(replies).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, asc, sql as sql2, and, or } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async updateUserRole(userId, role) {
    await db.update(users).set({ role, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId));
  }
  async banUser(userId) {
    await db.update(users).set({ banned: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId));
  }
  async unbanUser(userId) {
    await db.update(users).set({ banned: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId));
  }
  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  // Forum operations
  async createForum(forum) {
    const [newForum] = await db.insert(forums).values(forum).returning();
    return newForum;
  }
  async getForums() {
    const forumsWithStats = await db.select({
      id: forums.id,
      name: forums.name,
      description: forums.description,
      icon: forums.icon,
      color: forums.color,
      slug: forums.slug,
      postCount: forums.postCount,
      viewCount: forums.viewCount,
      order: forums.order,
      requiresRole: forums.requiresRole,
      createdAt: forums.createdAt,
      updatedAt: forums.updatedAt
    }).from(forums).orderBy(asc(forums.order), asc(forums.createdAt));
    return forumsWithStats.map((forum) => ({
      ...forum,
      postCount: forum.postCount ?? 0,
      viewCount: forum.viewCount ?? 0
    }));
  }
  async getForum(id) {
    const [forum] = await db.select().from(forums).where(eq(forums.id, id));
    return forum;
  }
  async getForumBySlug(slug) {
    const [forum] = await db.select().from(forums).where(eq(forums.slug, slug));
    return forum;
  }
  async updateForum(id, forum) {
    await db.update(forums).set({ ...forum, updatedAt: /* @__PURE__ */ new Date() }).where(eq(forums.id, id));
  }
  async deleteForum(id) {
    await db.delete(forums).where(eq(forums.id, id));
  }
  async incrementForumViews(forumId) {
    await db.update(forums).set({
      viewCount: sql2`${forums.viewCount} + 1`,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(forums.id, forumId));
  }
  // Post operations
  async createPost(post) {
    const [newPost] = await db.insert(posts).values(post).returning();
    await db.update(forums).set({
      postCount: sql2`${forums.postCount} + 1`,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(forums.id, post.forumId));
    return newPost;
  }
  async getPosts(forumId, limit = 50, offset = 0) {
    const conditions = forumId ? [eq(posts.forumId, forumId)] : [];
    const postsWithDetails = await db.select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      authorId: posts.authorId,
      forumId: posts.forumId,
      viewCount: posts.viewCount,
      replyCount: posts.replyCount,
      pinned: posts.pinned,
      locked: posts.locked,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      author: users,
      forum: forums
    }).from(posts).innerJoin(users, eq(posts.authorId, users.id)).innerJoin(forums, eq(posts.forumId, forums.id)).where(conditions.length ? and(...conditions) : void 0).orderBy(desc(posts.pinned), desc(posts.createdAt)).limit(limit).offset(offset);
    const result = [];
    for (const post of postsWithDetails) {
      const attachments2 = await this.getAttachments(post.id);
      result.push({
        ...post,
        replyCount: post.replyCount ?? 0,
        attachments: attachments2
      });
    }
    return result;
  }
  async getPost(id) {
    const [post] = await db.select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      authorId: posts.authorId,
      forumId: posts.forumId,
      viewCount: posts.viewCount,
      replyCount: posts.replyCount,
      pinned: posts.pinned,
      locked: posts.locked,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      author: users,
      forum: forums
    }).from(posts).innerJoin(users, eq(posts.authorId, users.id)).innerJoin(forums, eq(posts.forumId, forums.id)).where(eq(posts.id, id));
    if (!post) return void 0;
    const attachments2 = await this.getAttachments(id);
    return {
      ...post,
      replyCount: post.replyCount ?? 0,
      attachments: attachments2
    };
  }
  async updatePost(id, post) {
    await db.update(posts).set({ ...post, updatedAt: /* @__PURE__ */ new Date() }).where(eq(posts.id, id));
  }
  async deletePost(id) {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    if (post) {
      await db.delete(posts).where(eq(posts.id, id));
      await db.update(forums).set({
        postCount: sql2`${forums.postCount} - 1`,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(forums.id, post.forumId));
    }
  }
  async incrementPostViews(postId) {
    await db.update(posts).set({
      viewCount: sql2`${posts.viewCount} + 1`,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(posts.id, postId));
  }
  // Reply operations
  async createReply(reply) {
    const [newReply] = await db.insert(replies).values(reply).returning();
    await db.update(posts).set({
      replyCount: sql2`${posts.replyCount} + 1`,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(posts.id, reply.postId));
    return newReply;
  }
  async getReplies(postId, offset = 0, limit = 50) {
    const result = await db.select().from(replies).where(eq(replies.postId, postId)).orderBy(asc(replies.createdAt)).limit(limit).offset(offset);
    return result;
  }
  async getReply(id) {
    const [reply] = await db.select().from(replies).where(eq(replies.id, id));
    return reply;
  }
  async updateReply(id, reply) {
    await db.update(replies).set({ ...reply, updatedAt: /* @__PURE__ */ new Date() }).where(eq(replies.id, id));
  }
  async deleteReply(id) {
    const [reply] = await db.select().from(replies).where(eq(replies.id, id));
    if (reply) {
      await db.delete(replies).where(eq(replies.id, id));
      await db.update(posts).set({
        replyCount: sql2`${posts.replyCount} - 1`,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(posts.id, reply.postId));
    }
  }
  // Attachment operations
  async createAttachment(attachment) {
    const [newAttachment] = await db.insert(attachments).values(attachment).returning();
    return newAttachment;
  }
  async getAttachments(postId) {
    return await db.select().from(attachments).where(eq(attachments.postId, postId)).orderBy(asc(attachments.createdAt));
  }
  async deleteAttachment(id) {
    await db.delete(attachments).where(eq(attachments.id, id));
  }
  // Search operations
  async searchPosts(query, offset = 0, limit = 50) {
    const searchTerms = query.toLowerCase().split(" ").filter((term) => term.length > 0);
    if (searchTerms.length === 0) return [];
    const searchConditions = searchTerms.map(
      (term) => or(
        sql2`LOWER(${posts.title}) LIKE ${"%" + term + "%"}`,
        sql2`LOWER(${posts.content}) LIKE ${"%" + term + "%"}`
      )
    );
    const postsWithDetails = await db.select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      authorId: posts.authorId,
      forumId: posts.forumId,
      viewCount: posts.viewCount,
      replyCount: posts.replyCount,
      pinned: posts.pinned,
      locked: posts.locked,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      author: users,
      forum: forums
    }).from(posts).innerJoin(users, eq(posts.authorId, users.id)).innerJoin(forums, eq(posts.forumId, forums.id)).where(and(...searchConditions)).orderBy(desc(posts.createdAt)).limit(limit).offset(offset);
    const result = [];
    for (const post of postsWithDetails) {
      const attachments2 = await this.getAttachments(post.id);
      result.push({
        ...post,
        replyCount: post.replyCount ?? 0,
        attachments: attachments2
      });
    }
    return result;
  }
};
var storage = new DatabaseStorage();

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"]
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`
      },
      verify
    );
    passport.use(strategy);
  }
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app2.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
        }).href
      );
    });
  });
}
var isAuthenticated = async (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1e3);
  if (now <= user.expires_at) {
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// server/routes.ts
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
var upload = multer({
  storage: multer.memoryStorage(),
  // Use memory storage for Vercel
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});
async function registerRoutes(app2) {
  await setupAuth(app2);
  app2.use("/uploads", express.static("uploads"));
  app2.post("/api/upload", isAuthenticated, upload.single("image"), async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.banned) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const filePath = path.join("uploads", fileName);
      await fs.rename(req.file.path, filePath);
      res.json({
        fileName: req.file.originalname,
        fileUrl: `/uploads/${fileName}`,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.patch("/api/users/:id/role", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const { role } = req.body;
      if (!["membro", "vip", "moderador", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      await storage.updateUserRole(req.params.id, role);
      res.json({ message: "Role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  app2.patch("/api/users/:id/ban", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || !["admin", "moderador"].includes(currentUser.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.banUser(req.params.id);
      res.json({ message: "User banned successfully" });
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ message: "Failed to ban user" });
    }
  });
  app2.patch("/api/users/:id/unban", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || !["admin", "moderador"].includes(currentUser.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.unbanUser(req.params.id);
      res.json({ message: "User unbanned successfully" });
    } catch (error) {
      console.error("Error unbanning user:", error);
      res.status(500).json({ message: "Failed to unban user" });
    }
  });
  app2.get("/api/forums", async (req, res) => {
    try {
      const forums2 = await storage.getForums();
      res.json(forums2);
    } catch (error) {
      console.error("Error fetching forums:", error);
      res.status(500).json({ message: "Failed to fetch forums" });
    }
  });
  app2.get("/api/forums/:slug", async (req, res) => {
    try {
      await storage.incrementForumViews(req.params.slug);
      const forum = await storage.getForumBySlug(req.params.slug);
      if (!forum) {
        return res.status(404).json({ message: "Forum not found" });
      }
      res.json(forum);
    } catch (error) {
      console.error("Error fetching forum:", error);
      res.status(500).json({ message: "Failed to fetch forum" });
    }
  });
  app2.post("/api/forums", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || !["admin", "moderador"].includes(currentUser.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      const forumData = insertForumSchema.parse(req.body);
      const forum = await storage.createForum(forumData);
      res.status(201).json(forum);
    } catch (error) {
      console.error("Error creating forum:", error);
      res.status(500).json({ message: "Failed to create forum" });
    }
  });
  app2.delete("/api/forums/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteForum(req.params.id);
      res.json({ message: "Forum deleted successfully" });
    } catch (error) {
      console.error("Error deleting forum:", error);
      res.status(500).json({ message: "Failed to delete forum" });
    }
  });
  app2.get("/api/posts", async (req, res) => {
    try {
      const forumId = req.query.forumId;
      const limit = req.query.limit ? parseInt(req.query.limit) : void 0;
      const offset = req.query.offset ? parseInt(req.query.offset) : void 0;
      const posts2 = await storage.getPosts(forumId, limit, offset);
      res.json(posts2);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });
  app2.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q;
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;
      if (!query || query.trim().length === 0) {
        return res.json([]);
      }
      const results = await storage.searchPosts(query.trim(), offset, limit);
      res.json(results);
    } catch (error) {
      console.error("Error searching posts:", error);
      res.status(500).json({ message: "Failed to search posts" });
    }
  });
  app2.get("/api/posts/:id", async (req, res) => {
    try {
      await storage.incrementPostViews(req.params.id);
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });
  app2.post("/api/posts", isAuthenticated, upload.array("attachments", 5), async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.banned) {
        return res.status(403).json({ message: "Access denied" });
      }
      const postData = insertPostSchema.parse({
        ...req.body,
        authorId: currentUser.id
      });
      const post = await storage.createPost(postData);
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const fileName = `${Date.now()}-${file.originalname}`;
          const filePath = path.join("uploads", fileName);
          await fs.rename(file.path, filePath);
          await storage.createAttachment({
            postId: post.id,
            fileName: file.originalname,
            fileUrl: `/uploads/${fileName}`,
            fileType: file.mimetype,
            fileSize: file.size
          });
        }
      }
      const postWithDetails = await storage.getPost(post.id);
      res.status(201).json(postWithDetails);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });
  app2.put("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      if (post.authorId !== currentUser?.id && !currentUser || !["admin", "moderador"].includes(currentUser.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      const { title, content } = req.body;
      await storage.updatePost(req.params.id, { title, content });
      const updatedPost = await storage.getPost(req.params.id);
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });
  app2.delete("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      if (post.authorId !== currentUser?.id && !currentUser || !["admin", "moderador"].includes(currentUser.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deletePost(req.params.id);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });
  app2.get("/api/posts/:postId/replies", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;
      const replies2 = await storage.getReplies(req.params.postId, offset, limit);
      res.json(replies2);
    } catch (error) {
      console.error("Error fetching replies:", error);
      res.status(500).json({ message: "Failed to fetch replies" });
    }
  });
  app2.post("/api/posts/:postId/replies", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.banned) {
        return res.status(403).json({ message: "Access denied" });
      }
      const replyData = insertReplySchema.parse({
        ...req.body,
        postId: req.params.postId,
        authorId: currentUser.id
      });
      const reply = await storage.createReply(replyData);
      res.status(201).json(reply);
    } catch (error) {
      console.error("Error creating reply:", error);
      res.status(500).json({ message: "Failed to create reply" });
    }
  });
  app2.put("/api/replies/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      const reply = await storage.getReply(req.params.id);
      if (!reply) {
        return res.status(404).json({ message: "Reply not found" });
      }
      if (reply.authorId !== currentUser?.id && !currentUser || !["admin", "moderador"].includes(currentUser.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      const { content } = req.body;
      await storage.updateReply(req.params.id, { content });
      const updatedReply = await storage.getReply(req.params.id);
      res.json(updatedReply);
    } catch (error) {
      console.error("Error updating reply:", error);
      res.status(500).json({ message: "Failed to update reply" });
    }
  });
  app2.delete("/api/replies/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      const reply = await storage.getReply(req.params.id);
      if (!reply) {
        return res.status(404).json({ message: "Reply not found" });
      }
      if (reply.authorId !== currentUser?.id && !currentUser || !["admin", "moderador"].includes(currentUser.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteReply(req.params.id);
      res.json({ message: "Reply deleted successfully" });
    } catch (error) {
      console.error("Error deleting reply:", error);
      res.status(500).json({ message: "Failed to delete reply" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "node:url";
var __dirname = path2.dirname(fileURLToPath(import.meta.url));
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(__dirname, "client", "src"),
      "@shared": path2.resolve(__dirname, "shared"),
      "@assets": path2.resolve(__dirname, "attached_assets")
    }
  },
  root: path2.resolve(__dirname, "client"),
  build: {
    outDir: path2.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: "0.0.0.0",
    port: 5e3,
    hmr: {
      port: 5e3
    },
    allowedHosts: "all",
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
import { fileURLToPath as fileURLToPath2 } from "node:url";
var __dirname2 = path3.dirname(fileURLToPath2(import.meta.url));
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    host: "0.0.0.0"
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: {
      ...serverOptions,
      allowedHosts: "all"
    },
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(__dirname2, "..", "dist", "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
async function startServer() {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  if (!process.env.VERCEL) {
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true
    }, () => {
      log(`serving on port ${port}`);
    });
  }
  return app;
}
startServer();
