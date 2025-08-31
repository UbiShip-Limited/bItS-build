/**
 * Template Processor
 * Handles conditional blocks and variable replacement in email templates
 */

export class TemplateProcessor {
  /**
   * Process a template string with variables and conditional blocks
   */
  static process(template: string, variables: Record<string, any>): string {
    let processed = template;

    // Process conditional blocks {{#if variable}}...{{/if}}
    processed = this.processConditionals(processed, variables);

    // Replace simple variables {{variable}}
    processed = this.replaceVariables(processed, variables);

    return processed;
  }

  /**
   * Process conditional blocks like {{#if trackingToken}}...{{/if}}
   */
  private static processConditionals(template: string, variables: Record<string, any>): string {
    // Pattern to match {{#if variable}}content{{/if}}
    const conditionalPattern = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    
    return template.replace(conditionalPattern, (match, variable, content) => {
      // Check if the variable exists and is truthy
      const value = variables[variable];
      
      if (value && value !== '' && value !== false && value !== null && value !== undefined) {
        // Variable is truthy, include the content
        return content;
      } else {
        // Variable is falsy, remove the entire block
        return '';
      }
    });
  }

  /**
   * Replace simple variables {{variable}}
   */
  private static replaceVariables(template: string, variables: Record<string, any>): string {
    let processed = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed = processed.replace(placeholder, String(value ?? ''));
    });
    
    return processed;
  }

  /**
   * Clean up any remaining unmatched template syntax
   * This ensures no template syntax is visible to end users
   */
  static cleanUnmatchedSyntax(template: string): string {
    // Remove any remaining {{#if}} blocks that weren't matched
    let cleaned = template.replace(/\{\{#if\s+\w+\}\}[\s\S]*?\{\{\/if\}\}/g, '');
    
    // Remove any remaining {{variable}} placeholders
    cleaned = cleaned.replace(/\{\{[^}]+\}\}/g, '');
    
    return cleaned;
  }
}