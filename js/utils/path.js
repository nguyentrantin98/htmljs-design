/**
 * Utilities for working with file and URL paths.
 */
export const Path = {
    ImgExt: ["tif", "pjp", "xbm", "jxl", "svgz", "jpeg", "ico", "tiff", "gif", "svg", "jfif", "webp", "png", "bmp", "pjpeg", "avif", "jpg"],
  
    /**
     * Check if the path corresponds to an image file.
     * @param {string} path - The file path.
     * @returns {boolean} - Returns true if the file is an image.
     */
    IsImage(path) {
      const extension = this.GetExtension(path).toLowerCase().substring(1);
      return this.ImgExt.includes(extension);
    },
  
    /**
     * Combine host and path, only if the path does not already contain a host.
     * @param {string} host - The host URL.
     * @param {string} path - The path URL.
     * @returns {string} - The combined URL.
     */
    CombineHostAndPath(host, path) {
      const containHost = this.ContainHost(path);
      return containHost ? path : this.Combine(host, path);
    },
  
    /**
     * Determine if a path contains a network host.
     * @param {string} path - The path to check.
     * @returns {boolean} - Returns true if the path contains a host.
     */
    ContainHost(path) {
      return path.includes("http://") || path.includes("https://");
    },
  
    /**
     * Get the file extension from a path.
     * @param {string} path - The path to extract from.
     * @returns {string} - The file extension, including the leading '.'.
     */
    GetExtension(path) {
      if (!path) return '';
      return path.substring(path.lastIndexOf("."));
    },
  
    /**
     * Get the filename from a path.
     * @param {string} path - The path to extract from.
     * @returns {string} - The filename.
     */
    GetFileName(path) {
      if (!path) return '';
      const lastSlash = path.lastIndexOf("/");
      return lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
    },
  
    /**
     * Get the filename without its extension.
     * @param {string} path - The path to extract from.
     * @returns {string} - The filename without the extension.
     */
    GetFileNameWithoutExtension(path) {
      if (!path) return '';
      const lastSlashIndex = path.lastIndexOf("/");
      const lastDotIndex = path.lastIndexOf(".");
      const start = lastSlashIndex >= 0 ? lastSlashIndex + 1 : 0;
      return path.substring(start, lastDotIndex);
    },
  
    /**
     * Combine multiple paths into one.
     * @param {...string} path - An array of path segments to combine.
     * @returns {string} - The combined path.
     */
    Combine(...path) {
      if (!path.length) return '';
      const nonEmptyPath = path.filter(x => x).map(x => {
        const heading = x[0] === '/' ? 1 : 0;
        const trailing = x[x.length - 1] === '/' ? x.length - 1 : x.length;
        return x.substring(heading, trailing);
      });
      return nonEmptyPath.join("/");
    }
  };
  