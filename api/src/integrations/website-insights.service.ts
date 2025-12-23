import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WebsiteInsightsService {
  private readonly logger = new Logger(WebsiteInsightsService.name);

  async fetchBasicInsights(url: string): Promise<{ title?: string; description?: string; keywords?: string; headings?: string[] }> {
    try {
      const { data } = await axios.get(url, { timeout: 10_000 });
      const html = String(data || '');
      const title = match1(html, /<title[^>]*>([^<]{1,200})<\/title>/i);
      const description = match1(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,300})["'][^>]*>/i)
        || match1(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{1,300})["'][^>]*>/i);
      const keywords = match1(html, /<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']{1,400})["'][^>]*>/i);
      const headings = [] as string[];
      const hMatches = html.match(/<h[12][^>]*>(.*?)<\/h[12]>/gi) || [];
      for (const h of hMatches.slice(0, 10)) {
        const txt = h.replace(/<[^>]+>/g, '').trim();
        if (txt) headings.push(txt.substring(0, 200));
      }
      return { title, description, keywords, headings };
    } catch (e) {
      this.logger.warn(`Website fetch failed for ${url}: ${(e as Error).message}`);
      return {};
    }
  }
}

function match1(s: string, re: RegExp): string | undefined {
  const m = re.exec(s); return m ? m[1]?.trim() : undefined;
}
