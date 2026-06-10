import { getDynamicBinderDataForSearch } from "@/lib/formidable";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const data = await getDynamicBinderDataForSearch(search);

  return Response.json(data);
}
