import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class MetaPostsService {
  private metaPosts = new Map<string, { content: string; metaPageId: string }>();

  create(content: string, metaPageId: string) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const record = { content, metaPageId };
    this.metaPosts.set(id, record);
    return { id, ...record };
  }

  findAll() {
    return Array.from(this.metaPosts.values());
  }

  findOne(id: string) {
    const metaPost = this.metaPosts.get(id);
    if (!metaPost) {
      throw new NotFoundException(`Meta post with ID ${id} not found`);
    }
    return metaPost;
  }

  update(id: string, updateData: { content: string }) {
    const metaPost = this.metaPosts.get(id);
    if (!metaPost) {
      throw new NotFoundException(`Meta post with ID ${id} not found`);
    }
    const updatedMetaPost = { ...metaPost, ...updateData };
    this.metaPosts.set(id, updatedMetaPost);
    return updatedMetaPost;
  }

  delete(id: string) {
    const metaPost = this.metaPosts.get(id);
    if (!metaPost) {
      throw new NotFoundException(`Meta post with ID ${id} not found`);
    }
    this.metaPosts.delete(id);
    return { id, deleted: true };
  }
}