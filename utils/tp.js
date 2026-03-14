/**
 * EutiMart HTML Content Processor
 *
 * Strips potentially dangerous tags and attributes from user-provided HTML
 * to prevent injection of scripts and other unwanted elements.
 */

function processContent(html) {
  let clean = html;

  const restrictedTags = [
    'script', 'img', 'svg', 'iframe', 'object', 'embed', 'form',
    'input', 'textarea', 'select', 'button', 'meta', 'link', 'style',
    'base', 'video', 'audio', 'source', 'canvas', 'applet',
  ];

  for (let pass = 0; pass < 3; pass++) {
    for (const tag of restrictedTags) {
      const regex1 = new RegExp(`<\\s*${tag}[^>]*>[\\s\\S]*?<\\s*/\\s*${tag}[^>]*>`, 'gi');
      clean = clean.replace(regex1, '');
      const regex2 = new RegExp(`<\\s*${tag}[^>]*\\/?>`, 'gi');
      clean = clean.replace(regex2, '');
    }
  }

  const restrictedAttrs = [
    'onerror', 'onload', 'onclick', 'ondblclick',
    'onkeydown', 'onkeyup', 'onkeypress',
    'onchange', 'onsubmit', 'onreset', 'onabort', 'onbeforeunload',
  ];

  for (const attr of restrictedAttrs) {
    const regex = new RegExp(`\\s+${attr}\\s*=\\s*(['"]).*?\\1`, 'gi');
    clean = clean.replace(regex, '');
    const regex2 = new RegExp(`\\s+${attr}\\s*=\\s*[^\\s>]+`, 'gi');
    clean = clean.replace(regex2, '');
  }

  return clean;
}

function _contentCheck(sanitizedHtml) {
  const patterns = [
    /onmouseover\s*=/i,
    /onmouseenter\s*=/i,
    /onmouseout\s*=/i,
    /onmousemove\s*=/i,
    /onfocus\s*=/i,
    /onblur\s*=/i,
    /onmouseleave\s*=/i,
    /javascript\s*:/i,
  ];
  return patterns.some(p => p.test(sanitizedHtml));
}

module.exports = { processContent, _contentCheck };
