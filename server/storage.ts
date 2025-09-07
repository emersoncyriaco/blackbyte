import {
  users,
  forums,
  posts,
  replies,
  attachments,
  type User,
  type UpsertUser,
  type InsertForum,
  type Forum,
  type InsertPost,
  type Post,
  type PostWithDetails,
  type ForumWithStats,
  type InsertReply,
  type Reply,
  type InsertAttachment,
  type Attachment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, sql, and, or } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(userId: string, role: string): Promise<void>;
  banUser(userId: string): Promise<void>;
  unbanUser(userId: string): Promise<void>;
  getAllUsers(): Promise<User[]>;

  // Forum operations
  createForum(forum: InsertForum): Promise<Forum>;
  getForums(): Promise<ForumWithStats[]>;
  getForum(id: string): Promise<Forum | undefined>;
  getForumBySlug(slug: string): Promise<Forum | undefined>;
  updateForum(id: string, forum: Partial<InsertForum>): Promise<void>;
  deleteForum(id: string): Promise<void>;
  incrementForumViews(forumId: string): Promise<void>;

  // Post operations
  createPost(post: InsertPost): Promise<Post>;
  getPosts(forumId?: string, limit?: number): Promise<PostWithDetails[]>;
  getPost(id: string): Promise<PostWithDetails | undefined>;
  updatePost(id: string, post: Partial<InsertPost>): Promise<void>;
  deletePost(id: string): Promise<void>;
  incrementPostViews(postId: string): Promise<void>;

  // Reply operations
  createReply(reply: InsertReply): Promise<Reply>;
  getReplies(postId: string, offset?: number, limit?: number): Promise<Reply[]>;
  getReply(id: string): Promise<Reply | undefined>;
  updateReply(id: string, reply: Partial<InsertReply>): Promise<void>;
  deleteReply(id: string): Promise<void>;

  // Search operations
  searchPosts(query: string, offset?: number, limit?: number): Promise<PostWithDetails[]>;

  // Attachment operations
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  getAttachments(postId: string): Promise<Attachment[]>;
  deleteAttachment(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(userId: string, role: string): Promise<void> {
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async banUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ banned: true, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async unbanUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ banned: false, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Forum operations
  async createForum(forum: InsertForum): Promise<Forum> {
    const [newForum] = await db.insert(forums).values(forum).returning();
    return newForum;
  }

  async getForums(): Promise<ForumWithStats[]> {
    const forumsWithStats = await db
      .select({
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
        updatedAt: forums.updatedAt,
      })
      .from(forums)
      .orderBy(asc(forums.order), asc(forums.createdAt));

    return forumsWithStats.map(forum => ({
      ...forum,
      postCount: forum.postCount ?? 0,
      viewCount: forum.viewCount ?? 0,
    }));
  }

  async getForum(id: string): Promise<Forum | undefined> {
    const [forum] = await db.select().from(forums).where(eq(forums.id, id));
    return forum;
  }

  async getForumBySlug(slug: string): Promise<Forum | undefined> {
    const [forum] = await db.select().from(forums).where(eq(forums.slug, slug));
    return forum;
  }

  async updateForum(id: string, forum: Partial<InsertForum>): Promise<void> {
    await db
      .update(forums)
      .set({ ...forum, updatedAt: new Date() })
      .where(eq(forums.id, id));
  }

  async deleteForum(id: string): Promise<void> {
    await db.delete(forums).where(eq(forums.id, id));
  }

  async incrementForumViews(forumId: string): Promise<void> {
    await db
      .update(forums)
      .set({ 
        viewCount: sql`${forums.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(forums.id, forumId));
  }

  // Post operations
  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    
    // Increment forum post count
    await db
      .update(forums)
      .set({ 
        postCount: sql`${forums.postCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(forums.id, post.forumId));

    return newPost;
  }

  async getPosts(forumId?: string, limit = 50, offset = 0): Promise<PostWithDetails[]> {
    const conditions = forumId ? [eq(posts.forumId, forumId)] : [];
    
    const postsWithDetails = await db
      .select({
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
        forum: forums,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .innerJoin(forums, eq(posts.forumId, forums.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(posts.pinned), desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    // Get attachments for each post
    const result: PostWithDetails[] = [];
    for (const post of postsWithDetails) {
      const attachments = await this.getAttachments(post.id);
      result.push({
        ...post,
        replyCount: post.replyCount ?? 0,
        attachments,
      });
    }

    return result;
  }

  async getPost(id: string): Promise<PostWithDetails | undefined> {
    const [post] = await db
      .select({
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
        forum: forums,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .innerJoin(forums, eq(posts.forumId, forums.id))
      .where(eq(posts.id, id));

    if (!post) return undefined;

    const attachments = await this.getAttachments(id);
    return { 
      ...post, 
      replyCount: post.replyCount ?? 0,
      attachments 
    };
  }

  async updatePost(id: string, post: Partial<InsertPost>): Promise<void> {
    await db
      .update(posts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(posts.id, id));
  }

  async deletePost(id: string): Promise<void> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    if (post) {
      await db.delete(posts).where(eq(posts.id, id));
      
      // Decrement forum post count
      await db
        .update(forums)
        .set({ 
          postCount: sql`${forums.postCount} - 1`,
          updatedAt: new Date()
        })
        .where(eq(forums.id, post.forumId));
    }
  }

  async incrementPostViews(postId: string): Promise<void> {
    await db
      .update(posts)
      .set({ 
        viewCount: sql`${posts.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(posts.id, postId));
  }

  // Reply operations
  async createReply(reply: InsertReply): Promise<Reply> {
    const [newReply] = await db.insert(replies).values(reply).returning();
    
    // Increment post reply count
    await db
      .update(posts)
      .set({ 
        replyCount: sql`${posts.replyCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(posts.id, reply.postId));

    return newReply;
  }

  async getReplies(postId: string, offset = 0, limit = 50): Promise<Reply[]> {
    const result = await db
      .select()
      .from(replies)
      .where(eq(replies.postId, postId))
      .orderBy(asc(replies.createdAt))
      .limit(limit)
      .offset(offset);
    return result;
  }

  async getReply(id: string): Promise<Reply | undefined> {
    const [reply] = await db.select().from(replies).where(eq(replies.id, id));
    return reply;
  }

  async updateReply(id: string, reply: Partial<InsertReply>): Promise<void> {
    await db
      .update(replies)
      .set({ ...reply, updatedAt: new Date() })
      .where(eq(replies.id, id));
  }

  async deleteReply(id: string): Promise<void> {
    const [reply] = await db.select().from(replies).where(eq(replies.id, id));
    if (reply) {
      await db.delete(replies).where(eq(replies.id, id));
      
      // Decrement post reply count
      await db
        .update(posts)
        .set({ 
          replyCount: sql`${posts.replyCount} - 1`,
          updatedAt: new Date()
        })
        .where(eq(posts.id, reply.postId));
    }
  }

  // Attachment operations
  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const [newAttachment] = await db.insert(attachments).values(attachment).returning();
    return newAttachment;
  }

  async getAttachments(postId: string): Promise<Attachment[]> {
    return await db
      .select()
      .from(attachments)
      .where(eq(attachments.postId, postId))
      .orderBy(asc(attachments.createdAt));
  }

  async deleteAttachment(id: string): Promise<void> {
    await db.delete(attachments).where(eq(attachments.id, id));
  }

  // Search operations
  async searchPosts(query: string, offset = 0, limit = 50): Promise<PostWithDetails[]> {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    if (searchTerms.length === 0) return [];

    // Create search conditions for title and content
    const searchConditions = searchTerms.map(term => 
      or(
        sql`LOWER(${posts.title}) LIKE ${'%' + term + '%'}`,
        sql`LOWER(${posts.content}) LIKE ${'%' + term + '%'}`
      )
    );

    const postsWithDetails = await db
      .select({
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
        forum: forums,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .innerJoin(forums, eq(posts.forumId, forums.id))
      .where(and(...searchConditions))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    // Get attachments for each post
    const result: PostWithDetails[] = [];
    for (const post of postsWithDetails) {
      const attachments = await this.getAttachments(post.id);
      result.push({
        ...post,
        replyCount: post.replyCount ?? 0,
        attachments,
      });
    }

    return result;
  }
}

export const storage = new DatabaseStorage();
