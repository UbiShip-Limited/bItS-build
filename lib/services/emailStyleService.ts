/**
 * Email Style Service for Bowen Island Tattoo Shop
 * Provides consistent, beautiful email templates matching the brand aesthetic
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

export class EmailStyleService {
  /**
   * Get base CSS styles for emails
   */
  static getBaseStyles(options: EmailStyleOptions = {}): string {
    const {
      primaryColor = emailColors.gold,
      backgroundColor = emailColors.obsidian,
      textColor = emailColors.textPrimary,
    } = options;

    return `
      /* Import Google Fonts */
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
      
      /* Reset styles */
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
      table { border-collapse: collapse !important; }
      body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
      
      /* Mobile styles */
      @media screen and (max-width: 600px) {
        .mobile-padding { padding: ${emailSpacing.md} !important; }
        .mobile-text-center { text-align: center !important; }
        .mobile-width-full { width: 100% !important; max-width: 100% !important; }
        .mobile-display-block { display: block !important; width: 100% !important; }
        h1 { font-size: 28px !important; line-height: 36px !important; }
        h2 { font-size: 24px !important; line-height: 32px !important; }
        h3 { font-size: 20px !important; line-height: 28px !important; }
        p { font-size: 16px !important; line-height: 24px !important; }
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .dark-mode-bg { background-color: ${backgroundColor} !important; }
        .dark-mode-text { color: ${textColor} !important; }
      }
      
      /* Base styles */
      body {
        background-color: ${backgroundColor};
        font-family: ${emailFonts.body}, ${emailFonts.fallback};
        color: ${textColor};
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: ${emailColors.obsidianLight};
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
      }
      
      /* Typography */
      h1, h2, h3, h4, h5, h6 {
        font-family: ${emailFonts.heading}, ${emailFonts.fallback};
        color: ${textColor};
        margin: 0;
        padding: 0;
        font-weight: 600;
        letter-spacing: 0.025em;
      }
      
      h1 {
        font-size: 36px;
        line-height: 44px;
        margin-bottom: ${emailSpacing.lg};
      }
      
      h2 {
        font-size: 28px;
        line-height: 36px;
        margin-bottom: ${emailSpacing.md};
      }
      
      h3 {
        font-size: 24px;
        line-height: 32px;
        margin-bottom: ${emailSpacing.md};
      }
      
      p {
        font-family: ${emailFonts.body}, ${emailFonts.fallback};
        font-size: 16px;
        line-height: 24px;
        color: ${emailColors.textSecondary};
        margin: 0 0 ${emailSpacing.md} 0;
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
      
      /* Button styles */
      .btn {
        display: inline-block;
        padding: 14px 32px;
        background-color: ${primaryColor};
        color: ${emailColors.obsidian};
        font-family: ${emailFonts.body}, ${emailFonts.fallback};
        font-size: 16px;
        font-weight: 600;
        text-decoration: none;
        border-radius: 8px;
        transition: all 0.3s ease;
        letter-spacing: 0.02em;
      }
      
      .btn:hover {
        background-color: ${emailColors.goldLight};
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(184, 149, 106, 0.3);
      }
      
      .btn-secondary {
        background-color: transparent;
        color: ${primaryColor};
        border: 2px solid ${primaryColor};
      }
      
      .btn-secondary:hover {
        background-color: rgba(184, 149, 106, 0.1);
        border-color: ${emailColors.goldLight};
      }
      
      /* Card styles */
      .card {
        background-color: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(184, 149, 106, 0.2);
        border-radius: 12px;
        padding: ${emailSpacing.lg};
        margin-bottom: ${emailSpacing.lg};
      }
      
      /* Divider styles */
      .divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, ${emailColors.gold}, transparent);
        margin: ${emailSpacing.xl} 0;
        opacity: 0.3;
      }
      
      .divider-ornamental {
        text-align: center;
        margin: ${emailSpacing.xl} 0;
        position: relative;
      }
      
      .divider-ornamental::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        width: 35%;
        height: 1px;
        background: linear-gradient(90deg, transparent, ${emailColors.gold});
        opacity: 0.3;
      }
      
      .divider-ornamental::after {
        content: '';
        position: absolute;
        right: 0;
        top: 50%;
        width: 35%;
        height: 1px;
        background: linear-gradient(270deg, transparent, ${emailColors.gold});
        opacity: 0.3;
      }
      
      .divider-ornamental span {
        display: inline-block;
        padding: 0 ${emailSpacing.md};
        color: ${emailColors.gold};
        font-size: 20px;
      }
      
      /* List styles */
      ul, ol {
        margin: 0 0 ${emailSpacing.md} 0;
        padding-left: ${emailSpacing.lg};
      }
      
      li {
        margin-bottom: ${emailSpacing.xs};
        color: ${emailColors.textSecondary};
      }
      
      /* Highlight box */
      .highlight {
        background: linear-gradient(135deg, rgba(184, 149, 106, 0.1), rgba(184, 149, 106, 0.05));
        border-left: 4px solid ${primaryColor};
        padding: ${emailSpacing.md};
        margin: ${emailSpacing.lg} 0;
        border-radius: 4px;
      }
      
      /* Footer styles */
      .footer {
        background-color: ${emailColors.obsidian};
        padding: ${emailSpacing.xl} ${emailSpacing.lg};
        text-align: center;
        border-top: 1px solid rgba(184, 149, 106, 0.2);
      }
      
      .footer p {
        color: ${emailColors.textMuted};
        font-size: 14px;
        line-height: 20px;
        margin-bottom: ${emailSpacing.sm};
      }
      
      .social-links {
        margin-top: ${emailSpacing.lg};
      }
      
      .social-links a {
        display: inline-block;
        margin: 0 ${emailSpacing.sm};
        opacity: 0.7;
        transition: opacity 0.3s ease;
      }
      
      .social-links a:hover {
        opacity: 1;
      }
    `;
  }

  /**
   * Create email header component
   */
  static createHeader(logoUrl?: string): string {
    return `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="background: linear-gradient(135deg, ${emailColors.obsidian}, ${emailColors.obsidianLight}); padding: ${emailSpacing.xl} ${emailSpacing.lg}; text-align: center; border-bottom: 2px solid ${emailColors.gold};">
            ${logoUrl ? `
              <img src="${logoUrl}" alt="Bowen Island Tattoo Shop" style="width: 180px; height: auto; margin-bottom: ${emailSpacing.md};" />
            ` : ''}
            <h1 style="font-family: ${emailFonts.heading}; color: ${emailColors.white}; font-size: 32px; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">
              Bowen Island Tattoo
            </h1>
            <p style="font-family: ${emailFonts.body}; color: ${emailColors.gold}; font-size: 14px; margin: ${emailSpacing.xs} 0 0 0; font-style: italic;">
              Custom tattoos, peaceful island studio
            </p>
          </td>
        </tr>
      </table>
    `;
  }

  /**
   * Create email footer component
   */
  static createFooter(): string {
    return `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="footer">
        <tr>
          <td align="center">
            <div class="divider-ornamental">
              <span>✦</span>
            </div>
            
            <h3 style="font-family: ${emailFonts.heading}; color: ${emailColors.gold}; font-size: 18px; margin-bottom: ${emailSpacing.md};">
              Visit Us
            </h3>
            
            <p style="color: ${emailColors.textSecondary};">
              565 Artisan Lane<br>
              Bowen Island, BC V0N1G2<br>
              Artisan Square<br>
              <br>
              Tuesday - Saturday<br>
              11:00 AM - 7:00 PM<br>
              <em style="font-size: 12px;">By appointment only</em>
            </p>
            
            <div class="social-links" style="margin: ${emailSpacing.lg} 0;">
              <a href="https://instagram.com/bowenislandtattooshop" style="color: ${emailColors.gold}; margin: 0 ${emailSpacing.sm};">Instagram</a>
              <span style="color: ${emailColors.textMuted};">•</span>
              <a href="https://www.facebook.com/bowenislandtattooshop" style="color: ${emailColors.gold}; margin: 0 ${emailSpacing.sm};">Facebook</a>
              <span style="color: ${emailColors.textMuted};">•</span>
              <a href="https://www.bowenislandtattooshop.com" style="color: ${emailColors.gold}; margin: 0 ${emailSpacing.sm};">Website</a>
            </div>
            
            <p style="font-size: 12px; color: ${emailColors.textMuted}; margin-top: ${emailSpacing.lg};">
              © ${new Date().getFullYear()} Bowen Island Tattoo. All rights reserved.<br>
              <a href="#" style="color: ${emailColors.textMuted}; text-decoration: underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    `;
  }

  /**
   * Create a button component
   */
  static createButton(text: string, href: string, variant: 'primary' | 'secondary' = 'primary'): string {
    const className = variant === 'primary' ? 'btn' : 'btn btn-secondary';
    return `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
        <tr>
          <td style="border-radius: 8px;" bgcolor="${variant === 'primary' ? emailColors.gold : 'transparent'}">
            <a href="${href}" class="${className}" style="
              display: inline-block;
              padding: 14px 32px;
              font-family: ${emailFonts.body};
              font-size: 16px;
              font-weight: 600;
              text-decoration: none;
              border-radius: 8px;
              letter-spacing: 0.02em;
              ${variant === 'primary' 
                ? `background-color: ${emailColors.gold}; color: ${emailColors.obsidian};` 
                : `background-color: transparent; color: ${emailColors.gold}; border: 2px solid ${emailColors.gold};`}
            ">
              ${text}
            </a>
          </td>
        </tr>
      </table>
    `;
  }

  /**
   * Create a content card component
   */
  static createCard(title: string, content: string, icon?: string): string {
    return `
      <div class="card" style="
        background-color: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(184, 149, 106, 0.2);
        border-radius: 12px;
        padding: ${emailSpacing.lg};
        margin-bottom: ${emailSpacing.lg};
      ">
        ${icon ? `<div style="text-align: center; margin-bottom: ${emailSpacing.md}; font-size: 32px;">${icon}</div>` : ''}
        ${title ? `<h3 style="font-family: ${emailFonts.heading}; color: ${emailColors.gold}; margin-bottom: ${emailSpacing.md};">${title}</h3>` : ''}
        <div style="color: ${emailColors.textSecondary};">
          ${content}
        </div>
      </div>
    `;
  }

  /**
   * Create an ornamental divider
   */
  static createDivider(style: 'simple' | 'ornamental' = 'simple'): string {
    if (style === 'ornamental') {
      return `
        <div class="divider-ornamental" style="text-align: center; margin: ${emailSpacing.xl} 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td width="35%" style="background: linear-gradient(90deg, transparent, ${emailColors.gold}); height: 1px; opacity: 0.3;"></td>
                    <td width="30%" align="center" style="color: ${emailColors.gold}; font-size: 20px; padding: 0 ${emailSpacing.md};">✦ ✦ ✦</td>
                    <td width="35%" style="background: linear-gradient(270deg, transparent, ${emailColors.gold}); height: 1px; opacity: 0.3;"></td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `;
    }
    
    return `<div class="divider" style="height: 1px; background: linear-gradient(90deg, transparent, ${emailColors.gold}, transparent); margin: ${emailSpacing.xl} 0; opacity: 0.3;"></div>`;
  }

  /**
   * Create a highlight box for important information
   */
  static createHighlight(content: string, icon?: string): string {
    return `
      <div class="highlight" style="
        background: linear-gradient(135deg, rgba(184, 149, 106, 0.1), rgba(184, 149, 106, 0.05));
        border-left: 4px solid ${emailColors.gold};
        padding: ${emailSpacing.md};
        margin: ${emailSpacing.lg} 0;
        border-radius: 4px;
      ">
        ${icon ? `<span style="color: ${emailColors.gold}; margin-right: ${emailSpacing.sm};">${icon}</span>` : ''}
        ${content}
      </div>
    `;
  }

  /**
   * Create a list component
   */
  static createList(items: string[], ordered: boolean = false): string {
    const tag = ordered ? 'ol' : 'ul';
    const listItems = items.map(item => `
      <li style="margin-bottom: ${emailSpacing.xs}; color: ${emailColors.textSecondary};">
        ${item}
      </li>
    `).join('');

    return `
      <${tag} style="margin: 0 0 ${emailSpacing.md} 0; padding-left: ${emailSpacing.lg};">
        ${listItems}
      </${tag}>
    `;
  }

  /**
   * Create a complete email template
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
      logoUrl,
      showHeader = true,
      showFooter = true,
      customStyles = '',
    } = options;

    const html = `
      <!DOCTYPE html>
      <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="x-apple-disable-message-reformatting">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <title>${subject}</title>
        
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
        
        <style>
          ${this.getBaseStyles()}
          ${customStyles}
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: ${emailColors.obsidian};">
        ${preheader ? `<div style="display: none; font-size: 1px; color: ${emailColors.obsidian}; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">${preheader}</div>` : ''}
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${emailColors.obsidian};">
          <tr>
            <td align="center" style="padding: ${emailSpacing.xl} ${emailSpacing.md};">
              <div class="email-container">
                ${showHeader ? this.createHeader(logoUrl) : ''}
                
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="padding: ${emailSpacing.xl} ${emailSpacing.lg};">
                      ${content}
                    </td>
                  </tr>
                </table>
                
                ${showFooter ? this.createFooter() : ''}
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Simple text version (you can enhance this based on the HTML content)
    const text = content.replace(/<[^>]*>/g, '').trim();

    return { html, text };
  }

  /**
   * Helper to convert a simple template to styled HTML
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
}

export default EmailStyleService;