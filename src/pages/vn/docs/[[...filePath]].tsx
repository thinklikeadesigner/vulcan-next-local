import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import path from "path";
import { getMdxPaths, MdxPath } from "@vulcanjs/mdx";
import {
  Link as NextLink,
  NextMuiLink,
  NextMuiListItemButton,
} from "@vulcanjs/next-mui";
import { promises as fsPromises, lstatSync, existsSync } from "fs";
import { List, ListItem, Link, Typography } from "@mui/material";
import matter from "gray-matter";
import { muiMdComponents } from "~/core/components/layout/muiMdComponents";

// Define components to allow them in your mdx files
// You can also replace HTML tags (components is passed to MDXProvider )
// @see https://mdxjs.com/table-of-components
const components = {
  ...muiMdComponents,
};

const docsBaseRoute = "/vn/docs";
const indexLink = (
  <div style={{ maxWidth: "1000px" }}>
    <NextLink href={docsBaseRoute}>
      <Typography>Back to documentation index</Typography>
    </NextLink>
  </div>
);

const homeLink = (
  <div style={{ margin: "32px auto", maxWidth: "1000px" }}>
    <NextLink href="/">
      <Typography>Back to home</Typography>
    </NextLink>
  </div>
);

function PreviousPageLink(props: { filePath: string }) {
  const splittedPath = props.filePath.split("/").filter(Boolean);
  // If the previous page is /docs, doesn't return anything. See indexLink instead
  if (splittedPath.length < 2) {
    return null;
  } else {
    const url = docsBaseRoute + "/" + splittedPath.slice(0, -1).join("/");
    return (
      <div style={{ margin: "8px auto", maxWidth: "1000px" }}>
        <Link href={url}>
          <Typography>Previous page</Typography>
        </Link>
      </div>
    );
  }
}

const header = (
  <Typography variant="h1">
    <Link href="/">
      {/* eslint-disable @next/next/no-img-element */}
      <img
        src="/img/vns-logo-96.png"
        alt="Vulcan Next logo"
        style={{ marginRight: "32px" }}
      />
    </Link>
    VN Live Documentation
  </Typography>
);

interface PageArguments {
  pages: Array<string>;
  filePath: string;
  source: MDXRemoteSerializeResult;
}

const MarkdownPage = ({ source, filePath }) => (
  <div className="MDXProvider root">
    {header}
    <PreviousPageLink filePath={filePath} />
    {indexLink}
    <hr style={{ margin: "32px auto" }}></hr>
    <MDXRemote {...source} components={components} />
    <hr style={{ margin: "32px auto" }}></hr>
    <PreviousPageLink filePath={filePath} />
    {indexLink}
    <style jsx>{`
      .MDXProvider.root {
        margin: 32px auto;
        max-width: 1000px;
      }
    `}</style>
  </div>
);

const FolderTableOfContent = ({
  filePath,
  pages,
}: {
  filePath: string;
  pages: Array<string>;
}) => (
  <div style={{ margin: "32px auto", maxWidth: "1000px" }}>
    {header}
    <Typography
      style={{ margin: "32px auto", textTransform: "capitalize" }}
      variant="h2"
    >
      {" "}
      {filePath.slice(0, -1)}{" "}
    </Typography>{" "}
    {/* Print the subfolders we're in */}
    <List>
      {pages.map((pageName) => (
        <NextMuiListItemButton
          key={pageName}
          href={`${docsBaseRoute}/${filePath}${pageName}`}
        >
          <Typography style={{ textTransform: "capitalize" }}>
            {
              pageName.replace(
                /-/g,
                " "
              ) /* we don't use the front matter of the file at this point to simplify loading, so we have to cleanup the name manually */
            }
          </Typography>
        </NextMuiListItemButton>
      ))}
      <hr></hr>
      <PreviousPageLink filePath={filePath} />
      {filePath ===
      "" /* Back home if we're in /docs, back to /docs if we're in a subfolder */
        ? homeLink
        : indexLink}
    </List>
  </div>
);
export default function DocPage({ pages, filePath, source }: PageArguments) {
  if (source) {
    // It's a file, not a folder
    return <MarkdownPage source={source} filePath={filePath} />;
  } else {
    // It's a folder
    return <FolderTableOfContent filePath={filePath} pages={pages} />;
  }
}

interface PathsProps {
  params: { filePath: Array<String> }; // Use String and not string to match vulcan-npm MdxPath syntax
}
const docContentRoot = "./src/vulcan-demo/content/vn/docs";
export async function getStaticPaths() {
  const docsDir = path.resolve(docContentRoot); // relative to the project root
  const files = await getMdxPaths(docsDir);
  // paths is the file without the extension, shaped as [{ params: { filePath: [ 'subfolder', 'file' ] } } ]
  const paths = spreadPaths(files);
  return {
    paths,
    fallback: false,
  };
}
function spreadPaths(files: MdxPath[]): PathsProps[] {
  const paths: Array<PathsProps> = [{ params: { filePath: [""] } }];
  // add all subfolder paths
  // example for the fileName "["subfolder1", "subfolder2", "file"]", push to paths ["subfolder1"], ["subfolder1", "subfolder2"] and ["subfolder1", "subfolder2", "file"]
  files.forEach((file) => {
    file.params.fileName.forEach((item, index, array) => {
      paths.push({ params: { filePath: array.slice(0, index + 1) } });
    });
  });
  return paths;
}

/**
 * Get the mdx files if the paths leads to a folder, or the content of the mdx file if it is.
 * Be sure that a folder returns two elements and a file returns three, or change the implementation of the page consequently.
 */
export async function getStaticProps({ params }) {
  // Check if the filePath is a file or a directory
  if (!params.filePath) {
    // We're in /docs
    return await getMdxPages(path.resolve(docContentRoot), ""); // relative to the project root
  } else {
    // we're in a file or a subfolder
    let resolvedPath = path.resolve(docContentRoot, params.filePath.join("/"));
    if (existsSync(resolvedPath) && lstatSync(resolvedPath).isDirectory()) {
      // We're in a subfolder
      return await getMdxPages(resolvedPath, params.filePath.join("/"));
    } else {
      // We're in a file
      resolvedPath = resolvedPath + ".md";
      // TODO: handle no .md files
      const source = await fsPromises.readFile(resolvedPath, {
        encoding: "utf8",
      });
      // MDX text - can be from a local file, database, anywhere
      const { content, data } = matter(source);
      // Does a server-render of the source and relevant React wrappers + allow to inject React components
      const mdxSource = await serialize(content); //await renderToString(content, { components });
      return {
        props: {
          pages: [],
          filePath: params.filePath.join("/"),
          source: mdxSource,
        },
      };
    }
  }
}

/**
 * list the .md(x) files in the docs folder
 *
 * /!\ Be sure that this function returns only two elements.
 */
const getMdxPages = async (resolvedPath: string, filePath: string) => {
  //
  // we suppose that the page name is always the file name without extension (no frontmatter URL customization)
  // NOTE: if frontMatter is needed, an alternative would be using https://github.com/jescalan/babel-plugin-import-glob-array
  // to import all frontMatters
  const files = await getMdxPaths(resolvedPath);
  const pageNames = files.map((f) => f.params.fileName[0]);
  const pages = [...new Set(pageNames.sort())].filter((p) => !!p); // delete duplicates
  if (filePath) {
    filePath = filePath + "/";
  }
  return { props: { pages, filePath: filePath } };
};
