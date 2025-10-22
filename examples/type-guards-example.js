/**
 * Example: Using Type Guards to safely handle mixed node arrays
 * 
 * This example demonstrates how to use isTextNode() and isElementNode()
 * type guards to process XML content without constant type checking.
 */

import * as tXml from '../src/index.js';

// Example 1: Basic usage
console.log('=== Example 1: Basic Type Guard Usage ===\n');

const xml1 = '<div>Hello <span>World</span>!</div>';
const [div] = tXml.parse(xml1);

console.log('Children:', div.children);
console.log('\nProcessing each child:');

div.children.forEach((child, i) => {
  if (tXml.isTextNode(child)) {
    console.log(`  [${i}] Text node: "${child}"`);
  } else if (tXml.isElementNode(child)) {
    console.log(`  [${i}] Element node: <${child.tagName}>`);
  }
});

// Example 2: Filtering nodes by type
console.log('\n\n=== Example 2: Filtering with Type Guards ===\n');

const xml2 = '<article><h1>Title</h1>Some intro text<p>First paragraph</p>More text<p>Second paragraph</p></article>';
const [article] = tXml.parse(xml2);

const textNodes = article.children.filter(tXml.isTextNode);
const elementNodes = article.children.filter(tXml.isElementNode);

console.log('Text nodes:', textNodes);
console.log('Element nodes:', elementNodes.map(el => el.tagName));

// Example 3: Processing attributes with proper type checking
console.log('\n\n=== Example 3: Attribute Value Types ===\n');

const xml3 = '<input type="text" disabled required="" value="test" checked>';
const [input] = tXml.parse(xml3);

console.log('All attributes:', input.attributes);
console.log('\nAttribute analysis:');

for (const [name, value] of Object.entries(input.attributes)) {
  if (value === null) {
    console.log(`  ${name}: boolean attribute (no value)`);
  } else if (value === '') {
    console.log(`  ${name}: empty string value`);
  } else {
    console.log(`  ${name}: string value = "${value}"`);
  }
}

// Example 4: Real-world scenario - extracting data
console.log('\n\n=== Example 4: Real-World Usage ===\n');

const blogPost = `
<post>
  <title>Understanding Type Guards</title>
  <meta author="John Doe" date="2025-10-22"/>
  <content>
    Type guards make code safer.
    <code>isTextNode(x)</code> checks types.
    They work great with <strong>TypeScript</strong>!
  </content>
  <tags>
    <tag>javascript</tag>
    <tag>typescript</tag>
    <tag>tutorial</tag>
  </tags>
</post>
`.trim();

const [post] = tXml.parse(blogPost);

// Extract title
const titleEl = post.children.find(child => 
  tXml.isElementNode(child) && child.tagName === 'title'
);
const title = titleEl ? titleEl.children.join('') : '';

// Extract metadata
const metaEl = post.children.find(child => 
  tXml.isElementNode(child) && child.tagName === 'meta'
);
const metadata = metaEl ? metaEl.attributes : {};

// Extract content (text and elements)
const contentEl = post.children.find(child => 
  tXml.isElementNode(child) && child.tagName === 'content'
);

let contentText = '';
let contentElements = [];

if (contentEl) {
  contentText = contentEl.children
    .filter(tXml.isTextNode)
    .join(' ')
    .trim()
    .replace(/\s+/g, ' ');
  
  contentElements = contentEl.children
    .filter(tXml.isElementNode)
    .map(el => el.tagName);
}

// Extract tags
const tagsEl = post.children.find(child => 
  tXml.isElementNode(child) && child.tagName === 'tags'
);

const tags = tagsEl 
  ? tagsEl.children
      .filter(tXml.isElementNode)
      .map(el => el.children.join(''))
  : [];

console.log('Post Data:');
console.log('  Title:', title);
console.log('  Author:', metadata.author);
console.log('  Date:', metadata.date);
console.log('  Content Text:', contentText);
console.log('  Content Elements:', contentElements);
console.log('  Tags:', tags);

// Example 5: Using selfClosingTags option
console.log('\n\n=== Example 5: selfClosingTags Option ===\n');

const htmlSnippet = '<head><link rel="stylesheet" href="style.css"><title>My Page</title></head>';

// Default parsing (link is self-closing in HTML)
const [defaultHead] = tXml.parse(htmlSnippet);
const defaultLink = defaultHead.children.find(child => 
  tXml.isElementNode(child) && child.tagName === 'link'
);

console.log('Default parsing (HTML mode - link is self-closing):');
console.log('  Link element:', defaultLink ? defaultLink.tagName : 'N/A');
console.log('  Link attributes:', defaultLink ? defaultLink.attributes : 'N/A');
console.log('  Link children count:', defaultLink ? defaultLink.children.length : 'N/A');

// RSS/XML example where we need link to have content
const rssLink = '<channel><url>https://example.com</url><title>My Feed</title></channel>';
const [rssChannel] = tXml.parse(rssLink, { selfClosingTags: [] });
const rssLinkEl = rssChannel.children.find(child => 
  tXml.isElementNode(child) && child.tagName === 'url'
);

console.log('\nRSS parsing with selfClosingTags: []:');
console.log('  URL element:', rssLinkEl ? rssLinkEl.tagName : 'N/A');
console.log('  URL content:', rssLinkEl ? rssLinkEl.children[0] : 'N/A');

console.log('\n✓ All examples completed!');
