import fs from "fs";

const src = fs.readFileSync("lib/sample-spec.ts", "utf8");
const yaml = src.match(/`([\s\S]*)`/)[1];
const fd = new FormData();
fd.append("content", yaml);
fd.append("fileName", "demo.yaml");

const res = await fetch("http://localhost:3000/api/scan", {
  method: "POST",
  body: fd,
});
const data = await res.json();
console.log("created", data.scanId, data.job?.status);

for (let i = 0; i < 20; i++) {
  await new Promise((r) => setTimeout(r, 500));
  const job = await fetch(`http://localhost:3000/api/scan/${data.scanId}`).then(
    (r) => r.json()
  );
  console.log(job.status, job.progress, job.findings?.length ?? 0);
  if (job.status === "completed" || job.status === "failed") {
    console.log(job.message);
    break;
  }
}
