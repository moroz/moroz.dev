const matter = require("gray-matter");
const fs = require("fs");

const listAllFiles = () => {
  return fs.readdirSync(process.cwd());
};

const files = listAllFiles();

files.forEach((fn) => {
  if (!fn.match(/\.md$/)) return;

  const contents = fs.readFileSync(fn);

  if (!contents) return;

  const { data } = matter(contents);

  if (!data) return;

  const newPath = `${data.slug}.md`;

  if (fn === newPath) return;

  console.log(`Renaming file ${fn} to ${newPath}`);

  fs.renameSync(fn, newPath);
});
