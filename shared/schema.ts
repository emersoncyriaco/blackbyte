import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("membro"), // membro, vip, moderador, admin
  banned: boolean("banned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Forum categories
export const forums = pgTable("forums", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon").notNull(),
  color: varchar("color").notNull(),
  slug: varchar("slug").notNull().unique(),
  postCount: integer("post_count").default(0),
  viewCount: integer("view_count").default(0),
  order: integer("order").default(0),
  requiresRole: varchar("requires_role").default("membro"), // minimum role required
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Forum posts
export const posts = pgTable("posts", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Post attachments
export const attachments = pgTable("attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id),
  fileName: varchar("file_name").notNull(),
  fileUrl: varchar("file_url").notNull(),
  fileType: varchar("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post replies
export const replies = pgTable("replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  postId: varchar("post_id").notNull().references(() => posts.id),
  parentReplyId: varchar("parent_reply_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  replies: many(replies),
}));

export const forumsRelations = relations(forums, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  forum: one(forums, {
    fields: [posts.forumId],
    references: [forums.id],
  }),
  attachments: many(attachments),
  replies: many(replies),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  post: one(posts, {
    fields: [attachments.postId],
    references: [posts.id],
  }),
}));

export const repliesRelations = relations(replies, ({ one, many }): any => ({
  author: one(users, {
    fields: [replies.authorId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [replies.postId],
    references: [posts.id],
  }),
  parentReply: one(replies, {
    fields: [replies.parentReplyId],
    references: [replies.id],
  }),
  childReplies: many(replies),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertForumSchema = createInsertSchema(forums).omit({
  id: true,
  postCount: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  viewCount: true,
  replyCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReplySchema = createInsertSchema(replies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertForum = z.infer<typeof insertForumSchema>;
export type Forum = typeof forums.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertReply = z.infer<typeof insertReplySchema>;
export type Reply = typeof replies.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Attachment = typeof attachments.$inferSelect;

// Extended types for API responses
export type PostWithDetails = Post & {
  author: User;
  forum: Forum;
  attachments: Attachment[];
  replyCount: number;
};

export type ForumWithStats = Forum & {
  postCount: number;
  viewCount: number;
  latestPost?: PostWithDetails;
};
