/**
 * Email Style Service for Bowen Island Tattoo Shop
 * Frontend version for email template preview
 */

// Import style constants from the existing global styles
const emailColors = {
  obsidian: '#0A0A0A',
  obsidianLight: '#1a1a1a',
  white: '#FAFAF9',
  gold: '#B8956A',
  goldLight: '#D4B896',
  goldDark: '#9A7A54',
  slate: '#4A4A48',
  slateLight: '#7A7A74',
  textPrimary: '#FAFAF9',
  textSecondary: 'rgba(250, 250, 249, 0.7)',
  textMuted: 'rgba(250, 250, 249, 0.5)',
};

const emailFonts = {
  heading: "'Cinzel', Georgia, serif",
  body: "'Lora', Georgia, serif",
  fallback: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

const emailSpacing = {
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

interface EmailStyleOptions {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
}

export default class EmailStyleService {
  /**
   * Get base CSS styles for emails
   */
  static getBaseStyles(options: EmailStyleOptions = {}): string {
    const {
      primaryColor = emailColors.gold,
      backgroundColor = emailColors.obsidian,
      textColor = emailColors.textPrimary,
      fontFamily = emailFonts.body,
    } = options;

    return `
      /* Base Styles */
      body {
        margin: 0;
        padding: 0;
        font-family: ${fontFamily}, ${emailFonts.fallback};
        background-color: ${backgroundColor};
        color: ${textColor};
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      table {
        border-collapse: collapse;
        width: 100%;
      }

      h1, h2, h3, h4, h5, h6 {
        font-family: ${emailFonts.heading}, ${emailFonts.fallback};
        margin: 0 0 ${emailSpacing.md} 0;
        line-height: 1.3;
        font-weight: 400;
        letter-spacing: 2px;
        text-transform: uppercase;
      }

      h1 { font-size: 32px; color: ${primaryColor}; }
      h2 { font-size: 24px; color: ${emailColors.textPrimary}; }
      h3 { font-size: 20px; color: ${emailColors.textPrimary}; }

      p {
        margin: 0 0 ${emailSpacing.md} 0;
        line-height: 1.8;
      }

      a {
        color: ${primaryColor};
        text-decoration: none;
        transition: color 0.3s ease;
      }

      a:hover {
        color: ${emailColors.goldLight};
        text-decoration: underline;
      }

      .button {
        display: inline-block;
        padding: ${emailSpacing.sm} ${emailSpacing.lg};
        background: linear-gradient(135deg, ${primaryColor} 0%, ${emailColors.goldDark} 100%);
        color: ${emailColors.white};
        font-family: ${emailFonts.heading}, ${emailFonts.fallback};
        text-transform: uppercase;
        letter-spacing: 2px;
        font-size: 14px;
        border-radius: 0;
        text-decoration: none;
        transition: all 0.3s ease;
      }

      .button:hover {
        background: linear-gradient(135deg, ${emailColors.goldDark} 0%, ${primaryColor} 100%);
        transform: translateY(-1px);
      }
    `;
  }

  /**
   * Get the HTML wrapper for email content
   */
  static getEmailWrapper(content: string, options: EmailStyleOptions = {}): string {
    const styles = this.getBaseStyles(options);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${styles}</style>
        </head>
        <body>
          <table role="presentation" style="width: 100%; background-color: ${emailColors.obsidian};">
            <tr>
              <td align="center" style="padding: ${emailSpacing.xxl} ${emailSpacing.md};">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: ${emailColors.obsidianLight}; border: 1px solid ${emailColors.gold};">
                  <!-- Header -->
                  <tr>
                    <td style="padding: ${emailSpacing.xl}; text-align: center; border-bottom: 1px solid rgba(184, 149, 106, 0.3);">
                      <h1 style="margin: 0; color: ${emailColors.gold}; font-family: ${emailFonts.heading};">
                        BOWEN ISLAND TATTOO
                      </h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: ${emailSpacing.xl};">
                      ${content}
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: ${emailSpacing.lg}; text-align: center; border-top: 1px solid rgba(184, 149, 106, 0.3); color: ${emailColors.textMuted}; font-size: 12px;">
                      <p style="margin: ${emailSpacing.xs} 0;">
                        © ${new Date().getFullYear()} Bowen Island Tattoo Shop
                      </p>
                      <p style="margin: ${emailSpacing.xs} 0;">
                        <a href="https://bowenislandtattooshop.com" style="color: ${emailColors.gold};">
                          bowenislandtattooshop.com
                        </a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  /**
   * Process template variables in content
   */
  static processVariables(content: string, variables: Record<string, string>): string {
    let processed = content;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(regex, value);
    });

    return processed;
  }

  /**
   * Create a styled list component
   */
  static createList(items: string[]): string {
    const listItems = items.map(item =>
      `<li style="margin-bottom: ${emailSpacing.xs}; color: ${emailColors.textSecondary};">${item}</li>`
    ).join('');
    return `<ul style="margin: 0 0 ${emailSpacing.md} 0; padding-left: ${emailSpacing.lg};">${listItems}</ul>`;
  }

  /**
   * Enhance plain text template with HTML formatting
   */
  static enhanceTemplate(plainContent: string, variables: Record<string, any> = {}): string {
    // Replace variables
    let enhanced = plainContent;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      enhanced = enhanced.replace(regex, String(value));
    });

    // Convert line breaks to paragraphs
    enhanced = enhanced
      .split('\n\n')
      .map(para => para.trim())
      .filter(para => para)
      .map(para => {
        // Check if it's a heading (starts with capital letter and ends with colon)
        if (para.endsWith(':') && para.length < 50) {
          return `<h3 style="font-family: ${emailFonts.heading}; color: ${emailColors.gold}; margin-top: ${emailSpacing.lg}; margin-bottom: ${emailSpacing.md};">${para}</h3>`;
        }
        // Check if it's a list item
        if (para.startsWith('- ')) {
          const items = para.split('\n').map(item => item.replace(/^- /, '').trim());
          return this.createList(items);
        }
        // Regular paragraph
        return `<p style="font-family: ${emailFonts.body}; color: ${emailColors.textSecondary}; line-height: 1.6;">${para}</p>`;
      })
      .join('\n');

    return enhanced;
  }

  /**
   * Create a complete email template with header and footer
   */
  static createEmailTemplate(
    subject: string,
    content: string,
    options: {
      preheader?: string;
      logoUrl?: string;
      showHeader?: boolean;
      showFooter?: boolean;
      customStyles?: string;
    } = {}
  ): { html: string; text: string } {
    const {
      preheader = '',
      showHeader = true,
      showFooter = true,
      customStyles = '',
    } = options;

    const styles = this.getBaseStyles();

    const headerSection = showHeader ? `
      <tr>
        <td style="padding: ${emailSpacing.xl}; text-align: center; border-bottom: 1px solid rgba(184, 149, 106, 0.3);">
          <h1 style="margin: 0; color: ${emailColors.gold}; font-family: ${emailFonts.heading};">
            BOWEN ISLAND TATTOO
          </h1>
        </td>
      </tr>
    ` : '';

    const footerSection = showFooter ? `
      <tr>
        <td style="padding: ${emailSpacing.lg}; text-align: center; border-top: 1px solid rgba(184, 149, 106, 0.3); color: ${emailColors.textMuted}; font-size: 12px;">
          <p style="margin: ${emailSpacing.xs} 0;">
            © ${new Date().getFullYear()} Bowen Island Tattoo Shop
          </p>
          <p style="margin: ${emailSpacing.xs} 0;">
            <a href="https://bowenislandtattooshop.com" style="color: ${emailColors.gold};">
              bowenislandtattooshop.com
            </a>
          </p>
        </td>
      </tr>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>${styles}${customStyles}</style>
        </head>
        <body>
          ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}
          <table role="presentation" style="width: 100%; background-color: ${emailColors.obsidian};">
            <tr>
              <td align="center" style="padding: ${emailSpacing.xxl} ${emailSpacing.md};">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: ${emailColors.obsidianLight}; border: 1px solid ${emailColors.gold};">
                  ${headerSection}
                  <tr>
                    <td style="padding: ${emailSpacing.xl};">
                      ${content}
                    </td>
                  </tr>
                  ${footerSection}
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Extract text version from content (simple strip HTML tags)
    const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

    return { html, text };
  }
}