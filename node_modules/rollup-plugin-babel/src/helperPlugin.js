export default function importHelperPlugin ({ types: t }) {
	/**
	 * This function is needed because of a bug in Babel 6.x, which prevents the
	 * declaration of an ExportDefaultDeclaration to be replaced with an
	 * expression.
	 * That bug has been fixed in Babel 7.
	 */
	function replaceWith (path, replacement) {
		if (
			path.parentPath.isExportDefaultDeclaration() &&
			t.isExpression(replacement)
		) {
			path.parentPath.replaceWith(t.exportDefaultDeclaration(replacement));
		} else {
			path.replaceWith(replacement);
		}
	}

	return {
		visitor: {
			ClassDeclaration (path, state) {
				replaceWith(path, state.file.addHelper('classCallCheck'));
			}
		}
	};
}
