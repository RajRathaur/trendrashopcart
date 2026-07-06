import { defineMcp } from "@lovable.dev/mcp-js";
import searchProducts from "./tools/search-products";
import getProduct from "./tools/get-product";
import listCategories from "./tools/list-categories";

export default defineMcp({
  name: "trendra-mcp",
  title: "Trendra Shop",
  version: "0.1.0",
  instructions:
    "Trendra is an Indian e-commerce store. Use `search_products` to find items by keywords and optional price range, `get_product` for full details of a specific product, and `list_categories` to browse the catalog structure. Product links follow /product/<slug>.",
  tools: [searchProducts, getProduct, listCategories],
});
