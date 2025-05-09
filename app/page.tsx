"use client"

import { useState, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/cjs/styles/prism"
import { useTheme } from "next-themes"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileDown, Copy, Github } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState(
    "# Hello, World!\n\nStart typing your markdown here...\n\n## Features\n\n- Real-time preview\n- Export to PDF\n- Copy to clipboard\n\n> This is a blockquote\n\n```js\nconsole.log('Hello, World!');\n```\n\n## Table Example\n\n| Tables        | Are           | Cool  |\n| ------------- |:-------------:| -----:|\n| col 3 is      | right-aligned | $1600 |\n| col 2 is      | centered      |   $12 |\n| zebra stripes | are neat      |    $1 |",
  )
  const previewRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  const handleExport = async () => {
    if (!previewRef.current) return

    try {
      toast({
        title: "Preparing PDF...",
        description: "Please wait while we generate your PDF.",
      })

      // Get the content div
      const content = previewRef.current

      // Create a PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Get the width and height of A4 in pixels (assuming 96 DPI)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      // Capture the entire content in one go
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: content.scrollWidth,
        windowHeight: content.scrollHeight,
      })

      const imgData = canvas.toDataURL("image/jpeg", 1.0)

      // Calculate dimensions to fit the content properly
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      // Add first page
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      // Add subsequent pages if needed
      while (heightLeft > 0) {
        position = (-pdfHeight * (imgHeight - heightLeft)) / imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save("markdown-export.pdf")

      toast({
        title: "PDF exported!",
        description: "Your document has been downloaded.",
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your document.",
        variant: "destructive",
      })
      console.error("PDF export error:", error)
    }
  }

  const handleCopy = async () => {
    if (!previewRef.current) return

    try {
      const content = previewRef.current.innerText
      await navigator.clipboard.writeText(content)

      toast({
        title: "Copied!",
        description: "Content copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "There was an error copying to clipboard.",
        variant: "destructive",
      })
      console.error("Copy error:", error)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b p-4 bg-white dark:bg-gray-950">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold">Markdown Editor</h1>
          <a
            href="https://github.com/Abhi-rangi/JUMP_MarkDown"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <Github size={16} />
            <span>By Abhishek Rangi</span>
          </a>
        </div>
      </header>

      <main className="flex-1 container py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
          {/* Editor Pane */}
          <div className="flex flex-col h-full">
            <div className="mb-2 flex justify-between items-center">
              <h2 className="text-lg font-medium">Markdown</h2>
            </div>
            <Textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="flex-1 font-mono text-sm p-4 resize-none h-full"
              placeholder="Type your markdown here..."
            />
          </div>

          {/* Preview Pane */}
          <div className="flex flex-col h-full">
            <div className="mb-2 flex justify-between items-center">
              <h2 className="text-lg font-medium">Preview</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="flex items-center gap-1"
                >
                  <Copy size={16} />
                  <span>Copy</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="flex items-center gap-1"
                >
                  <FileDown size={16} />
                  <span>Export PDF</span>
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <div
                ref={previewRef}
                className="bg-white dark:bg-gray-950 shadow-md mx-auto overflow-visible border rounded-md"
                style={{
                  width: "210mm", // A4 width
                  minHeight: "297mm", // A4 height
                  padding: "20mm",
                  boxSizing: "border-box",
                  marginBottom: "20px",
                }}
              >
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={theme === "dark" ? vscDarkPlus : vs}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                      table({ node, ...props }) {
                        return (
                          <div className="overflow-x-auto my-4">
                            <table
                              className="min-w-full divide-y divide-gray-300 dark:divide-gray-700"
                              {...props}
                            />
                          </div>
                        );
                      },
                      th({ node, ...props }) {
                        return (
                          <th
                            className="px-3 py-3.5 text-left text-sm font-semibold bg-gray-100 dark:bg-gray-800"
                            {...props}
                          />
                        );
                      },
                      td({ node, ...props }) {
                        return <td className="px-3 py-2 text-sm" {...props} />;
                      },
                    }}
                  >
                    {markdown}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Toaster />
    </div>
  );
}
