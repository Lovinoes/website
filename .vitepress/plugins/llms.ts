import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { SiteConfig } from 'vitepress';

interface SidebarNode {
  text?: string;
  link?: string;
  items?: SidebarNode[];
}

const mdUrl = (siteUrl: string, link: string): string =>
  link.endsWith('/') ? `${siteUrl}${link}index.md` : `${siteUrl}${link}.md`;

function sectionLinks(node: SidebarNode, siteUrl: string): string[] {
  const lines: string[] = [];
  const walk = (n: SidebarNode) => {
    if (n.link && n.text) lines.push(`- [${n.text}](${mdUrl(siteUrl, n.link)})`);
    n.items?.forEach(walk);
  };
  walk(node);
  return lines;
}

async function pageTitle(file: string, fallback: string): Promise<string> {
  const source = await readFile(file, 'utf8');
  return source.match(/^---[\s\S]*?^title:\s*(.+?)\s*$[\s\S]*?^---/m)?.[1] ?? fallback;
}

/**
 * Emits `llms.txt` (generated from the sidebar) and copies every markdown
 * source into the output dir, so each page is also served as raw `.md`.
 */
export async function generateLlmsArtifacts(siteConfig: SiteConfig, siteUrl: string): Promise<void> {
  const { outDir, srcDir, pages, site } = siteConfig;

  for (const page of pages) {
    const dest = join(outDir, page);
    await mkdir(dirname(dest), { recursive: true });
    await copyFile(join(srcDir, page), dest);
  }

  const sections: string[] = [];

  const sidebar = (site.themeConfig?.sidebar ?? []) as SidebarNode[];
  for (const group of sidebar) {
    const links = sectionLinks(group, siteUrl);
    if (group.text && links.length > 0) sections.push(`## ${group.text}\n\n${links.join('\n')}`);
  }

  const comparePages = pages.filter((p) => p.startsWith('compare/')).sort();
  if (comparePages.length > 0) {
    const links = await Promise.all(
      comparePages.map(async (page) => {
        const slug = page.replace(/\.md$/, '');
        const title = await pageTitle(join(srcDir, page), slug);
        return `- [${title}](${siteUrl}/${page})`;
      }),
    );
    sections.push(`## Comparisons\n\n${links.join('\n')}`);
  }

  const content = `# Calagopus

> ${site.description}

Calagopus is free for personal and commercial use (MIT-licensed core), supports any game that runs in a Linux Docker container, and provides migration tooling for Pterodactyl and Pelican. Source code: https://github.com/calagopus

Every page below links to its raw Markdown version; the rendered HTML lives at the same URL without the \`.md\` suffix (for \`index.md\`, drop the filename).

- [Homepage](${siteUrl}/index.md)

${sections.join('\n\n')}

## Optional

- [Extension development bundle (all extension docs, single file)](${siteUrl}/ai-doc/extensions.md)
`;

  await writeFile(join(outDir, 'llms.txt'), content);
}
