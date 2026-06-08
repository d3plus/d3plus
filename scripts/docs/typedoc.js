import path from "node:path";
import {ReflectionKind} from "typedoc";

/**
 * Extracts JSDoc tag content from a reflection's comment.
 */
export function getTag(comment, tagName) {
  if (!comment) return undefined;
  const tag = comment.blockTags?.find(t => t.tag === `@${tagName}`);
  return tag ? tag.content.map(c => c.text).join("") : undefined;
}

/**
 * Gets the display text from a TypeDoc comment.
 * Prefers @desc/@description block tag (used in JSDoc-style comments)
 * over summary text (which may contain @function/@class name artifacts).
 */
export function getCommentText(comment) {
  if (!comment) return "";
  const desc = getTag(comment, "desc") || getTag(comment, "description");
  if (desc) return desc.trim();
  return comment.summary?.map(c => c.text).join("").trim() || "";
}

/**
 * Gets the source file info from a reflection.
 */
export function getSource(reflection) {
  const source = reflection.sources?.[0];
  if (!source) return null;
  return {
    fileName: source.fileName,
    line: source.line,
    fullFileName: source.fullFileName,
  };
}

/**
 * Maps a TypeDoc type to a simple type name string.
 */
export function typeToString(type) {
  if (!type) return "*";
  switch (type.type) {
    case "intrinsic":
      return type.name;
    case "reference":
      return type.name;
    case "literal":
      return JSON.stringify(type.value);
    case "union":
      return type.types.map(typeToString).join(" | ");
    case "array":
      return `Array.&lt;${typeToString(type.elementType)}&gt;`;
    case "reflection":
      if (type.declaration?.signatures?.length) return "Function";
      return "Object";
    case "predicate":
      return "Boolean";
    case "typeOperator":
      return typeToString(type.target);
    default:
      return "*";
  }
}

/**
 * Maps a TypeDoc type to an array of type name strings (for jsdoc compat).
 */
export function typeToNames(type) {
  if (!type) return ["*"];
  if (type.type === "union") {
    return type.types.map(t => typeToString(t));
  }
  return [typeToString(type)];
}

/**
 * Resolves the parent class names for a class reflection.
 * Handles "default" exports by matching source file paths.
 */
export function resolveParentNames(reflection) {
  if (reflection.kind !== ReflectionKind.Class) return [];
  const extendedTypes = reflection.extendedTypes || [];
  return extendedTypes
    .map(t => {
      if (t.name && t.name !== "default") return t.name;
      if (t._target?.fileName) {
        const targetFile = t._target.fileName;
        const siblings = reflection.parent?.children || [];
        const match = siblings.find(s =>
          s.kind === ReflectionKind.Class &&
          s.name !== reflection.name &&
          s.sources?.[0]?.fullFileName === targetFile
        );
        if (match) return match.name;
      }
      return t.name;
    })
    .filter(n => n && n !== "Object" && n !== "any" && n !== "default");
}

/**
 * Gets the kind string for a reflection.
 */
export function reflectionKindToString(kind) {
  switch (kind) {
    case ReflectionKind.Class: return "class";
    case ReflectionKind.Function: return "function";
    case ReflectionKind.Variable: return "member";
    case ReflectionKind.Enum: return "constant";
    case ReflectionKind.Interface: return "typedef";
    case ReflectionKind.Namespace: return "namespace";
    case ReflectionKind.Method: return "function";
    default: return "member";
  }
}

/**
 * Converts a TypeDoc reflection into a jsdoc-compatible data object.
 * Used by the args and stories stubs.
 */
export function reflectionToJsdoc(reflection, folder) {
  const source = getSource(reflection);
  const kind = reflectionKindToString(reflection.kind);
  const comment = reflection.comment || reflection.signatures?.[0]?.comment;
  const desc = getCommentText(comment);
  const isChainable = getTag(comment, "chainable") !== undefined;

  // Getter/setter accessors are declared as overloads with the no-arg getter
  // first, so signatures[0] often has no parameters. Pull params from the first
  // signature that actually declares them (the setter) so configurable methods
  // like renderer()/locale()/on() aren't dropped for appearing param-less.
  const sigs = reflection.signatures || [];
  const sig = sigs.find(s => s.parameters?.length) || sigs[0];
  const params = (sig?.parameters || []).map(p => ({
    name: p.name,
    type: {names: typeToNames(p.type)},
    optional: p.flags?.isOptional || p.defaultValue !== undefined,
    defaultvalue: p.defaultValue ? p.defaultValue.replace(/^["']|["']$/g, "") : undefined,
    description: getCommentText(p.comment),
  }));

  let metaPath = "";
  let metaFilename = "";
  if (source) {
    const fullPath = source.fullFileName || path.resolve(folder, source.fileName);
    metaPath = path.dirname(fullPath);
    metaFilename = path.basename(fullPath);
  }

  const obj = {
    kind,
    name: reflection.name,
    description: desc,
    access: reflection.flags?.isPrivate ? "private" : undefined,
    undocumented: !comment,
    scope: "global",
    params,
    meta: {path: metaPath, filename: metaFilename},
    chainable: isChainable,
  };

  if (reflection.kind === ReflectionKind.Class) {
    obj.augments = resolveParentNames(reflection);
  }

  return obj;
}

/**
 * Converts class methods into jsdoc-compatible data objects.
 */
export function methodsToJsdoc(reflection, folder) {
  if (reflection.kind !== ReflectionKind.Class) return [];
  const children = reflection.children || [];
  return children
    .filter(child =>
      child.kind === ReflectionKind.Method ||
      child.kind === ReflectionKind.Property
    )
    .map(child => {
      const doc = reflectionToJsdoc(child, folder);
      doc.memberof = reflection.name;
      doc.scope = "static";
      return doc;
    });
}

/**
 * Converts TypeDoc reflections into the public docs array format
 * expected by the args and stories stubs.
 */
export function buildPublicDocs(reflections, folder) {
  const docs = [];

  for (const reflection of reflections) {
    const jsdoc = reflectionToJsdoc(reflection, folder);
    if (jsdoc.access === "private" || jsdoc.undocumented) continue;
    docs.push(jsdoc);

    const methods = methodsToJsdoc(reflection, folder);
    for (const method of methods) {
      if (method.access === "private" || method.undocumented) continue;
      docs.push(method);
    }
  }

  return docs;
}
