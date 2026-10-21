/**
    Downloads a Blob as a file by clicking a temporary `<a download>` link.
    @param blob The file contents.
    @param filename The name to save the file as, including its extension.
*/
export default function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking the URL right away can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 40000);
}
