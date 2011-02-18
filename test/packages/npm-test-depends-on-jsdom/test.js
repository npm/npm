require.paths.unshift
  ( "./node_modules"
  , "../node_modules"
  , "../../node_modules"
  , "../../../node_modules"
  , "../../../../node_modules"
  , "../../../../../node_modules"
  , "../../../../../../node_modules"
  , "../../../../../../../node_modules"
  , "../../../../../../../../node_modules")

require("jsdom")
require("htmlparser")
