# ... (at the top of your file with other imports)


# ... (inside your @app.get("/api/documents/{file_path:path}") endpoint)
# i have to get bs4 and urlib

# Add these imports at the top of your Python file
import base64
from bs4 import BeautifulSoup # pip install beautifulsoup4
from urllib.parse import unquote # To handle URL-encoded filenames if any
import os
import shutil # For shutil.which to find libreoffice
import mimetypes
import subprocess
import tempfile
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import FileResponse, HTMLResponse

# ... (your existing imports: os, shutil, mimetypes, subprocess, tempfile, Path, etc.)
# ... (FastAPI imports, Settings, logger, etc.)



# --- Helper Functions ---
def is_path_secure_and_valid(client_path_str: str, allowed_roots: List[Path]) -> Optional[Path]:
    """
    Validates if the client-provided absolute path is:
    1. Syntactically an absolute path.
    2. Resolves to a real file.
    3. Falls within one of the `allowed_roots`.
    Returns the resolved Path object if valid, None otherwise.
    Raises HTTPException for specific failure reasons.
    """
    if not client_path_str or not client_path_str.startswith("/"): # Or os.path.isabs for OS-agnostic check
        raise HTTPException(status_code=400, detail="Invalid path: Not an absolute path.")

    try:
        # Resolve the path (handles '..', symlinks, etc.) and ensure it exists (strict=True)
        resolved_path = Path(client_path_str).resolve(strict=True)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found at: {client_path_str}")
    except Exception as e: # Catch other resolution errors (e.g., permission issues during resolve)
        print(f"Error resolving path '{client_path_str}': {e}")
        raise HTTPException(status_code=500, detail="Error processing file path.")

    if not resolved_path.is_file():
        raise HTTPException(status_code=400, detail=f"Path is not a file: {client_path_str}")

    # Security Check: Ensure the resolved path is within an allowed root
    is_allowed = False
    for root in allowed_roots:
        try:
            # Check if root is an ancestor of resolved_path or they are the same
            if resolved_path == root or root in resolved_path.parents:
                is_allowed = True
                break
        except Exception: # Should not happen with pre-resolved paths, but for safety
            continue
    
    if not is_allowed:
        print(f"SECURITY ALERT: Unauthorized access attempt to '{resolved_path}' (original: '{client_path_str}')")
        raise HTTPException(status_code=403, detail="Access to this file path is forbidden.")

    return resolved_path

def embed_images_as_base64(html_content: str, base_path: Path) -> str:
    """
    Parses HTML content, finds local image references, and embeds them as Base64.
    Args:
        html_content: The HTML string.
        base_path: The directory where the HTML file and its associated images are located.
    Returns:
        HTML string with images embedded as Base64.
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    images_embedded_count = 0
    for img_tag in soup.find_all('img'):
        src = img_tag.get('src')
        if src and not src.startswith(('http:', 'https:', 'data:')):
            # It's a relative path, resolve it against the HTML file's location
            # LibreOffice might create subdirectories for images, e.g., "_html_images"
            # or put them in the same directory.
            
            # Handle URL-encoded filenames from LibreOffice (e.g., %20 for space)
            image_relative_path_decoded = unquote(src)
            image_path = (base_path / image_relative_path_decoded).resolve()

            # Security check: ensure image_path is still within base_path
            # This is important if `src` could somehow contain `../` etc.
            if not str(image_path).startswith(str(base_path.resolve())):
                logger.warning(f"Skipping image due to potential path traversal: {src} from base {base_path}")
                continue

            if image_path.is_file():
                try:
                    with open(image_path, "rb") as image_file:
                        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                    
                    # Guess MIME type for the data URI
                    mime_type, _ = mimetypes.guess_type(image_path)
                    mime_type = mime_type or 'image/png' # Default if guess fails

                    img_tag['src'] = f"data:{mime_type};base64,{encoded_string}"
                    images_embedded_count += 1
                    # logger.debug(f"Embedded image: {image_path}")
                except Exception as e:
                    logger.error(f"Error embedding image {image_path}: {e}")
            else:
                logger.warning(f"Image not found for embedding: {image_path} (original src: {src})")
    
    if images_embedded_count > 0:
        logger.info(f"Successfully embedded {images_embedded_count} images as Base64.")
    return str(soup)


# *** UPDATED *** convert_to_html_with_libreoffice
def convert_to_html_with_libreoffice(source_file: Path, output_dir: Path, embed_images: bool = True) -> str: # Returns HTML string
    """
    Converts a document to HTML using LibreOffice.
    Optionally embeds images as Base64.
    Raises exceptions on failure. Returns the HTML content as a string.
    """
    if not LIBREOFFICE_PATH:
        raise RuntimeError("LibreOffice binary path is not configured or found.")
    if not source_file.exists():
        raise FileNotFoundError(f"Source file for conversion does not exist: {source_file}")

    # LibreOffice will create files in output_dir.
    # We expect an HTML file and potentially image files/subdirectories.
    
    cmd = [
        LIBREOFFICE_PATH, "--headless", "--nolockcheck", "--nodefault",
        "--norestore", "--invisible",
        "--convert-to", "html:HTML (StarWriter)", # This filter usually handles images better
        # Forcing a specific HTML export filter might be needed if images are problematic
        # e.g. "html:XHTML Writer File" might behave differently with images
        "--outdir", str(output_dir), str(source_file)
    ]

    try:
        process = subprocess.run(cmd, check=True, timeout=120, capture_output=True, text=True, errors='replace')
        if process.stderr:
             logger.info(f"LibreOffice STDERR for {source_file.name} conversion: {process.stderr[:1000]}") # Log stderr
    except subprocess.TimeoutExpired as e:
        error_msg = f"LibreOffice conversion timed out for {source_file.name}. Stderr: {e.stderr}"
        logger.error(error_msg)
        raise RuntimeError(error_msg) from e
    except subprocess.CalledProcessError as e:
        error_msg = (f"LibreOffice conversion failed for {source_file.name} (exit code {e.returncode}).\n"
                     f"Stderr: {e.stderr[:1000]}\nStdout: {e.stdout[:1000]}")
        logger.error(error_msg)
        raise RuntimeError(error_msg) from e
    except Exception as e:
        error_msg = f"Unexpected error during LibreOffice execution for {source_file.name}: {e}"
        logger.error(error_msg)
        raise RuntimeError(error_msg) from e

    # Find the generated HTML file. LibreOffice typically names it based on the source stem.
    # It might also create subfolders like 'filename_html_SOMEHASH' or just 'filename.html'
    
    # Try common naming patterns first
    expected_html_filename = source_file.stem + ".html"
    html_file_path = output_dir / expected_html_filename
    
    if not html_file_path.is_file():
        # Fallback: search for any .html file in the output directory
        # This is less precise but can catch cases where LO uses a different naming scheme
        html_files_in_output = list(output_dir.glob("*.html"))
        if not html_files_in_output:
            # Also check one level deep for subdirectories LO might create
            for item in output_dir.iterdir():
                if item.is_dir():
                    html_files_in_output.extend(list(item.glob("*.html")))
            
            if not html_files_in_output:
                error_msg = f"LibreOffice conversion for {source_file.name} seemed to succeed, but no HTML output file found in {output_dir} or its immediate subdirectories."
                logger.error(error_msg)
                raise FileNotFoundError(error_msg)
        
        html_file_path = html_files_in_output[0] # Take the first one found
        logger.warning(f"Expected HTML file '{expected_html_filename}' not found. Using first found: '{html_file_path.name}'")

    logger.info(f"LibreOffice successfully converted '{source_file.name}' to '{html_file_path}'.")
    
    with open(html_file_path, "r", encoding="utf-8", errors="replace") as f:
        html_content = f.read()

    if embed_images:
        logger.info(f"Attempting to embed images for {html_file_path.name} from base directory {html_file_path.parent}")
        # The base path for resolving relative image URLs is the directory containing the HTML file.
        html_content_with_embedded_images = embed_images_as_base64(html_content, html_file_path.parent)
        return html_content_with_embedded_images
    
    return html_content

# *** UPDATED *** /api/documents/{file_path:path} endpoint
@app.get("/api/documents/{file_path:path}")
async def get_document(
    file_path: str,
    action: str = Query("view", enum=["view", "download"]),
):
    try:
        valid_src_path: Path = is_path_secure_and_valid(file_path, ALLOWED_DOCUMENT_ROOTS) # Your validation function
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during path validation for '{file_path}': {e}")
        raise HTTPException(status_code=500, detail="Server error during path validation.")

    file_extension = valid_src_path.suffix.lower()
    mime_type, _ = mimetypes.guess_type(valid_src_path)
    mime_type = mime_type or "application/octet-stream"

    try:
        if action == "download":
            return FileResponse(
                path=valid_src_path, media_type=mime_type, filename=valid_src_path.name,
                headers={"Content-Disposition": f'attachment; filename="{valid_src_path.name}"'}
            )
        
        elif action == "view":
            # --- DOC/DOCX to HTML (with embedded images) ---
            if file_extension in [".doc", ".docx"] and LIBREOFFICE_PATH:
                with tempfile.TemporaryDirectory(prefix="lo_html_convert_") as tmp_dir_str:
                    tmp_output_dir = Path(tmp_dir_str)
                    try:
                        # Call the updated function that returns HTML string
                        html_content_with_embedded_images = convert_to_html_with_libreoffice(
                            valid_src_path, 
                            tmp_output_dir,
                            embed_images=True # Ensure this is true
                        )
                        return HTMLResponse(content=html_content_with_embedded_images)
                    except (RuntimeError, FileNotFoundError) as conversion_error:
                        logger.error(f"HTML conversion failed for {valid_src_path.name}: {conversion_error}")
                        return HTMLResponse(
                            content=f"<html><body><h1>Preview Unavailable</h1><p>Could not generate a preview for {valid_src_path.name}. Error: {str(conversion_error)[:200]}...</p><p>You can try downloading the file directly.</p></body></html>",
                            status_code=500
                        )
            
            # --- PPT/PPTX to PDF ---
            # *** NEW ***
            elif file_extension in [".ppt", ".pptx"] and LIBREOFFICE_PATH:
                with tempfile.TemporaryDirectory(prefix="lo_pdf_convert_") as tmp_dir_str:
                    tmp_output_dir = Path(tmp_dir_str)
                    try:
                        # LibreOffice command for PDF conversion
                        cmd_pdf = [
                            LIBREOFFICE_PATH, "--headless", "--nolockcheck", "--nodefault",
                            "--norestore", "--invisible",
                            "--convert-to", "pdf:writer_pdf_Export", # Specific PDF export filter
                            "--outdir", str(tmp_output_dir), str(valid_src_path)
                        ]
                        process_pdf = subprocess.run(cmd_pdf, check=True, timeout=180, capture_output=True, text=True, errors='replace')
                        if process_pdf.stderr:
                            logger.info(f"LibreOffice PDF conversion STDERR for {valid_src_path.name}: {process_pdf.stderr[:1000]}")

                        pdf_filename = valid_src_path.stem + ".pdf"
                        converted_pdf_path = tmp_output_dir / pdf_filename

                        if not converted_pdf_path.is_file():
                            # Fallback: search for any .pdf file
                            pdf_files = list(tmp_output_dir.glob("*.pdf"))
                            if not pdf_files:
                                raise FileNotFoundError("LibreOffice PDF conversion failed: No PDF file found.")
                            converted_pdf_path = pdf_files[0]
                            logger.warning(f"Expected PDF file '{pdf_filename}' not found. Using first found: '{converted_pdf_path.name}'")
                        
                        logger.info(f"Successfully converted '{valid_src_path.name}' to PDF: '{converted_pdf_path}'")
                        return FileResponse(
                            path=converted_pdf_path,
                            media_type="application/pdf",
                            filename=valid_src_path.stem + ".pdf", # Suggest a filename for the browser
                            content_disposition_type="inline" # Tell browser to display inline
                        )

                    
                       # HIGHLIGHTED CHANGE SECTION: PPT/PPTX Conversion Error Handling
                    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError, RuntimeError) as conversion_error:
                        logger.error(f"PDF conversion failed for {valid_src_path.name}: {conversion_error}")
                        
                        # Instead of returning the original file, return an HTML error page
                        # You can make this HTML more elaborate if needed
                        error_html_content = f"""
                        <html>
                            <head><title>Preview Error</title></head>
                            <body style="font-family: sans-serif; padding: 20px;">
                                <h1>PDF Preview Unavailable</h1>
                                <p>Could not generate a PDF preview for the file: <strong>{valid_src_path.name}</strong>.</p>
                                <p>Reason: {str(conversion_error)[:250]}...</p>
                                <p>You can try downloading the original file instead.</p>
                                <!-- Optional: Add a direct link to download the original file -->
                                <!-- This would require knowing the base URL or constructing it carefully -->
                                <!-- <p><a href="/api/documents/{file_path}?action=download">Download Original File ({valid_src_path.name})</a></p> -->
                                <p><button onclick="window.close()">Close Tab</button></p>
                            </body>
                        </html>
                        """
                        return HTMLResponse(content=error_html_content, status_code=500)
                    # END OF HIGHLIGHTED CHANGE SECTION
            
            elif file_extension == ".html":
                return FileResponse(path=valid_src_path, media_type="text/html", content_disposition_type="inline")

            elif mime_type and (mime_type.startswith("image/") or mime_type.startswith("text/") or mime_type == "application/pdf"):
                return FileResponse(path=valid_src_path, media_type=mime_type, content_disposition_type="inline")
            
            else: # Other types
                logger.info(f"Attempting inline view for '{valid_src_path.name}' (MIME: {mime_type}). Browser may download.")
                return FileResponse(path=valid_src_path, media_type=mime_type, content_disposition_type="inline", filename=valid_src_path.name)

    except PermissionError:
        logger.error(f"Permission denied accessing file: {valid_src_path}")
        raise HTTPException(status_code=403, detail="Server does not have permission to access this file.")
    except FileNotFoundError: # Should be caught by validation, but as safeguard
        raise HTTPException(status_code=404, detail="File not found during action processing.")
    except Exception as e:
        logger.exception(f"Unexpected error during '{action}' for '{valid_src_path.name}'")
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred.")
