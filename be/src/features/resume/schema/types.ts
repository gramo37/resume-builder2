// ============================================================
// Resume Document
// ============================================================

export interface ResumeDocument {
  schema_version: "2.0";

  document: ResumeDocumentMetadata;

  template: ResumeTemplate;

  data: ResumeData;
}

// ============================================================
// Document
// ============================================================

export interface ResumeDocumentMetadata {
  id: string;
  name: string;
}

// ============================================================
// Template
// ============================================================

export interface ResumeTemplate {
  page: PageConfig;
  theme: ResumeTheme;
  layout: LayoutNode;
  components: Record<string, ComponentDefinition>;
}

// ============================================================
// Page
// ============================================================

export interface PageConfig {
  size: PageSize;
  orientation: PageOrientation;
  margin: PageMargin;
}

export type PageSize =
  | "A4"
  | "A3"
  | "A5"
  | "LETTER"
  | "LEGAL";

export type PageOrientation =
  | "portrait"
  | "landscape";

export interface PageMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// ============================================================
// Theme
// ============================================================

export interface ResumeTheme {
  font_family: string;

  colors: {
    text: string;
    muted: string;
    heading: string;
    accent: string;
    border: string;
    background: string;
  };

  typography?: {
    body?: TypographyStyle;
    heading?: TypographyStyle;
    section_heading?: TypographyStyle;
  };
}

export interface TypographyStyle {
  font_size?: number;
  font_weight?: FontWeight;
  line_height?: number;
  color?: ColorValue;
  text_transform?: TextTransform;
}

// ============================================================
// Layout Tree
// ============================================================

export type LayoutNode =
  | GridNode
  | ComponentNode
  | RepeatNode
  | SpacerNode;

// ------------------------------------------------------------
// Grid
// ------------------------------------------------------------

export interface GridNode {
  type: "grid";

  /**
   * Unique ID within the template.
   */
  id: string;

  /**
   * Grid column definitions.
   *
   * Examples:
   * ["1fr", "2fr"]
   * ["30%", "70%"]
   * ["1fr", "1fr", "1fr"]
   */
  columns: GridTrack[];

  /**
   * Optional explicit row definitions.
   */
  rows?: GridTrack[];

  /**
   * Gap between grid children.
   */
  gap?: number;

  /**
   * Child layout nodes.
   */
  children: LayoutNode[];

  style?: LayoutStyle;
}

export type GridTrack =
  | string
  | number;

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export interface ComponentNode {
  type: "component";

  /**
   * Unique ID for this placement.
   *
   * This is NOT the component definition ID.
   */
  id: string;

  /**
   * References template.components.
   */
  component_id: string;

  /**
   * Optional grid placement.
   */
  grid?: GridPlacement;

  /**
   * Optional local style overrides.
   */
  style?: LayoutStyle;
}

export interface GridPlacement {
  column?: number;
  row?: number;

  column_span?: number;
  row_span?: number;
}

// ------------------------------------------------------------
// Repeat
// ------------------------------------------------------------

export interface RepeatNode {
  type: "repeat";

  id: string;

  /**
   * Collection from the data section.
   */
  binding: CollectionBinding;

  /**
   * Name of the runtime item context.
   *
   * Example:
   * "project"
   */
  item_id: string;

  /**
   * Layout rendered for every item.
   */
  children: LayoutNode;

  style?: LayoutStyle;
}

// ------------------------------------------------------------
// Spacer
// ------------------------------------------------------------

export interface SpacerNode {
  type: "spacer";

  id: string;

  size?: number;

  style?: LayoutStyle;
}

// ============================================================
// Components
// ============================================================

export interface ComponentDefinition {
  type: ComponentType;

  /**
   * Data binding.
   *
   * Not every component needs a binding.
   * For example, a static heading can have no binding.
   */
  binding?: Binding;

  /**
   * Optional specialized renderer.
   *
   * Examples:
   * "experience"
   * "education"
   * "projects"
   * "skill_groups"
   */
  renderer?: ComponentRenderer;

  /**
   * Used by generic section components.
   */
  title?: string;

  /**
   * Child components.
   *
   * Mainly useful for composite components such as
   * header and section.
   */
  children?: ComponentChild[];

  /**
   * Component-level styling.
   */
  style?: ComponentStyle;
}

export type ComponentType =
  | "text"
  | "heading"
  | "section"
  | "contact"
  | "list"
  | "rich_text"
  | "divider"
  | "spacer";

export type ComponentRenderer =
  | "paragraph"
  | "experience"
  | "education"
  | "projects"
  | "skill_groups"
  | "list"
  | "contact"
  | "generic";

export interface ComponentChild {
  type: "component";

  component_id: string;

  binding?: Binding;

  style?: ComponentStyle;
}

// ============================================================
// Bindings
// ============================================================

export type Binding =
  | EntityBinding
  | CollectionBinding
  | ContextBinding;

// ------------------------------------------------------------
// Single entity / object
// ------------------------------------------------------------

export interface EntityBinding {
  source: "data";

  /**
   * Name of the data entity.
   *
   * Example:
   * "person"
   * "contact"
   * "summary"
   */
  entity: string;

  /**
   * Stable ID of the entity.
   */
  id: string;

  /**
   * Optional field within the entity.
   *
   * Example:
   * "name"
   */
  field?: string;
}

// ------------------------------------------------------------
// Collection
// ------------------------------------------------------------

export interface CollectionBinding {
  source: "data";

  /**
   * Name of the collection.
   *
   * Example:
   * "experience"
   * "projects"
   * "education"
   */
  collection: string;
}

// ------------------------------------------------------------
// Repeat context
// ------------------------------------------------------------

export interface ContextBinding {
  source: "context";

  /**
   * Runtime context created by a RepeatNode.
   *
   * Example:
   * "project"
   */
  context: string;

  /**
   * Field within the current item.
   *
   * Example:
   * "name"
   */
  field?: string;
}

// ============================================================
// Styles
// ============================================================

export interface ComponentStyle extends LayoutStyle {
  font_family?: string;
  font_size?: number;
  font_weight?: FontWeight;

  color?: ColorValue;
  background_color?: ColorValue;

  line_height?: number;

  text_align?: TextAlign;
  text_transform?: TextTransform;

  letter_spacing?: number;

  border?: BorderStyle;
  border_bottom?: BorderStyle;
  border_top?: BorderStyle;
  border_left?: BorderStyle;
  border_right?: BorderStyle;
}

export interface LayoutStyle {
  width?: string | number;
  height?: string | number;

  min_width?: string | number;
  max_width?: string | number;

  padding?: number | Spacing;
  margin?: number | Spacing;

  gap?: number;

  align_items?: AlignItems;
  justify_content?: JustifyContent;
  align_self?: AlignSelf;
}

export interface Spacing {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface BorderStyle {
  width?: number;
  color?: ColorValue;
  style?: BorderType;
}

export type BorderType =
  | "solid"
  | "dashed";

export type FontWeight =
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900;

export type TextAlign =
  | "left"
  | "center"
  | "right";

export type TextTransform =
  | "none"
  | "uppercase"
  | "lowercase"
  | "capitalize";

export type AlignItems =
  | "flex-start"
  | "center"
  | "flex-end"
  | "stretch";

export type AlignSelf =
  | "auto"
  | "flex-start"
  | "center"
  | "flex-end"
  | "stretch";

export type JustifyContent =
  | "flex-start"
  | "center"
  | "flex-end"
  | "space-between"
  | "space-around";

export type ColorValue =
  | string;

// ============================================================
// Resume Data
// ============================================================

export interface ResumeData {
  person: Person;

  contact: Contact;

  summary?: Summary;

  skills?: SkillGroup[];

  languages?: Language[];

  experience?: Experience[];

  projects?: Project[];

  education?: Education[];

  certifications?: Certification[];

  /**
   * Allows future/custom resume sections without changing
   * the core schema.
   */
  custom?: Record<string, CustomCollection>;
}

// ============================================================
// Person
// ============================================================

export interface Person {
  id: string;

  name: string;

  headline?: string;
}

// ============================================================
// Contact
// ============================================================

export interface Contact {
  id: string;

  email?: string;

  phone?: string;

  location?: string;

  links?: ContactLink[];
}

export interface ContactLink {
  id: string;

  label: string;

  url: string;
}

// ============================================================
// Summary
// ============================================================

export interface Summary {
  id: string;

  text: string;
}

// ============================================================
// Skills
// ============================================================

export interface SkillGroup {
  id: string;

  name: string;

  items: string[];
}

// ============================================================
// Languages
// ============================================================

export interface Language {
  id: string;

  name: string;

  level?: string;
}

// ============================================================
// Experience
// ============================================================

export interface Experience {
  id: string;

  company: string;

  title: string;

  location?: string;

  start_date?: string;

  end_date?: string | null;

  description?: string;

  achievements?: Achievement[];
}

export interface Achievement {
  id: string;

  text: string;
}

// ============================================================
// Projects
// ============================================================

export interface Project {
  id: string;

  name: string;

  url?: string;

  description?: string;

  technologies?: string[];

  achievements?: Achievement[];
}

// ============================================================
// Education
// ============================================================

export interface Education {
  id: string;

  degree: string;

  field?: string;

  institution: string;

  location?: string;

  start_date?: string;

  end_date?: string | null;

  description?: string;

  achievements?: Achievement[];
}

// ============================================================
// Certifications
// ============================================================

export interface Certification {
  id: string;

  name: string;

  issuer?: string;

  issue_date?: string;

  expiry_date?: string | null;

  url?: string;
}

// ============================================================
// Custom Data
// ============================================================

export interface CustomCollection {
  id: string;

  title?: string;

  items: CustomItem[];
}

export interface CustomItem {
  id: string;

  [key: string]: unknown;
}