"use client";

import React, { useState, useContext, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-tomorrow.css";
import { useTheme } from 'next-themes';

import { MessagesContext } from "@/context/MessagesContext";
import Prompt from "@/data/Prompt";
import { useConvex, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import {
  Code,
  FileCode,
  Loader2Icon,
  Plus,
  Save,
  Folder,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash
} from "lucide-react";
import { countToken } from "./ChatView";
import { UserDetailContext } from "@/context/UserDetailContext";
import { ActionContext } from "@/context/ActionContext";
import { motion, AnimatePresence } from "framer-motion";

function CodeView() {
  const { theme } = useTheme();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("code");
  const [files, setFiles] = useState({ "index.js": "// Write your code here..." });
  const [currentFile, setCurrentFile] = useState("index.js");
  const [loading, setLoading] = useState(false);
  const [lineCount, setLineCount] = useState(1);

  const editorRef = useRef(null);
  const highlightRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const { messages } = useContext(MessagesContext);
  const UpdateFiles = useMutation(api.workspace.UpdateFiles);
  const convex = useConvex();
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const UpdateTokens = useMutation(api.users.UpdateToken);
  const { action } = useContext(ActionContext);

  const [openFolders, setOpenFolders] = useState({});
  const [contextMenu, setContextMenu] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // Load workspace files
  useEffect(() => {
    if (id) GetFiles();
  }, [id]);

  useEffect(() => {
    if (action) setActiveTab("preview");
  }, [action]);

  const GetFiles = async () => {
    try {
      setLoading(true);
      const result = await convex.query(api.workspace.GetWorkspace, { workspaceId: id });
      if (result?.fileData && Object.keys(result.fileData).length > 0) {
        setFiles(result.fileData);
        setCurrentFile(Object.keys(result.fileData)[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // AI Code Generation
  useEffect(() => {
    if (messages?.length > 0) {
      const lastRole = messages[messages.length - 1].role;
      if (lastRole === "user") GenerateAiCode();
    }
  }, [messages]);

  const GenerateAiCode = async () => {
    try {
      setLoading(true);
      const PROMPT = JSON.stringify(messages) + " " + Prompt.CODE_GEN_PROMPT;
      const result = await axios.post("/api/gen-ai-code", { prompt: PROMPT });
      const aiResp = result.data;
      const aiFiles = aiResp?.files || {};

      if (Object.keys(aiFiles).length > 0) {
        setFiles(aiFiles);
        setCurrentFile(Object.keys(aiFiles)[0]);
        await UpdateFiles({ workspaceId: id, files: aiFiles });
      }

      let token = Number(userDetail?.token) - Number(countToken(JSON.stringify(aiResp)));
      if (token < 0) token = 0;
      await UpdateTokens({ userId: userDetail?._id, token });
      setUserDetail(prev => ({ ...prev, token }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Sync editor content and highlight
  useEffect(() => {
    if (editorRef.current) {
      const content = files[currentFile];
      const codeText = typeof content === "string" ? content : content?.code || "";
      editorRef.current.innerText = codeText;
      setLineCount(codeText.split("\n").length || 1);
      updateHighlighting(codeText);
    }
  }, [currentFile, files]);

  const updateHighlighting = (text) => {
    if (highlightRef.current) {
      highlightRef.current.innerHTML = Prism.highlight(
        text,
        Prism.languages.javascript,
        "javascript"
      );
    }
  };

  const handleEditorChange = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText;
      setLineCount(text.split("\n").length || 1);
      updateHighlighting(text);
      setFiles(prev => {
        const oldFile = prev[currentFile];
        if (typeof oldFile === "string") return { ...prev, [currentFile]: text };
        return { ...prev, [currentFile]: { ...oldFile, code: text } };
      });
    }
  };

  const handleScroll = (e) => {
    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = e.target.scrollTop;
    if (highlightRef.current) highlightRef.current.scrollTop = e.target.scrollTop;
  };

  const addNewFile = () => {
    const newFileName = `file${Object.keys(files).length + 1}.js`;
    setFiles(prev => ({ ...prev, [newFileName]: "// New file" }));
    setCurrentFile(newFileName);
    setLineCount(1);
  };

  const ensureUniquePath = (candidate, existingPaths) => {
    if (!existingPaths.includes(candidate)) return candidate;
    const extIndex = candidate.lastIndexOf('.');
    const base = extIndex === -1 ? candidate : candidate.slice(0, extIndex);
    const ext = extIndex === -1 ? '' : candidate.slice(extIndex);
    let i = 1;
    let next = `${base}-copy${i}${ext}`;
    while (existingPaths.includes(next)) {
      i++;
      next = `${base}-copy${i}${ext}`;
    }
    return next;
  };

  const handleRename = (oldPath, newNameRaw) => {
    if (!oldPath || !newNameRaw) {
      setRenaming(null);
      return;
    }
    const newName = newNameRaw.trim();
    if (!newName) {
      setRenaming(null);
      return;
    }

    setFiles(prevFiles => {
      const existing = Object.keys(prevFiles);
      const folderPrefix = oldPath + "/";
      const isFolder = existing.some(p => p === oldPath || p.startsWith(folderPrefix));

      const updated = { ...prevFiles };

      if (isFolder && existing.some(p => p.startsWith(folderPrefix))) {
        const parts = oldPath.split('/');
        parts[parts.length - 1] = newName;
        const newPath = parts.join('/');
        const newPrefix = newPath + '/';

        existing.forEach(p => {
          if (p === oldPath) {
            const candidate = newName;
            const unique = ensureUniquePath(candidate, Object.keys(updated).filter(k => k !== oldPath));
            updated[unique] = updated[oldPath];
            delete updated[oldPath];
            if (currentFile === oldPath) setCurrentFile(unique);
          } else if (p.startsWith(folderPrefix)) {
            const rest = p.slice(folderPrefix.length);
            const candidate = newPrefix + rest;
            const unique = ensureUniquePath(candidate, Object.keys(updated).filter(k => !k.startsWith(folderPrefix)));
            updated[unique] = updated[p];
            delete updated[p];
            if (currentFile === p) setCurrentFile(unique);
          }
        });

        setOpenFolders(prev => {
          const newOpen = {};
          Object.keys(prev).forEach(k => {
            if (k === oldPath) {
              const parts2 = k.split('/');
              parts2[parts2.length - 1] = newName;
              newOpen[parts2.join('/')] = prev[k];
            } else if (k.startsWith(folderPrefix)) {
              const rest = k.slice(folderPrefix.length);
              const parts2 = (newPath + '/' + rest).split('/');
              newOpen[parts2.join('/')] = prev[k];
            } else {
              newOpen[k] = prev[k];
            }
          });
          return newOpen;
        });

      } else {
        const parts = oldPath.split('/');
        parts[parts.length - 1] = newName;
        let newPath = parts.join('/');
        newPath = ensureUniquePath(newPath, Object.keys(updated).filter(k => k !== oldPath));
        updated[newPath] = updated[oldPath];
        delete updated[oldPath];
        if (currentFile === oldPath) setCurrentFile(newPath);
      }

      return updated;
    });

    setRenaming(null);
  };

  const handleDelete = (path) => {
    if (!path) return;

    setFiles(prevFiles => {
      const updated = { ...prevFiles };
      const prefix = path + "/";
      const keys = Object.keys(prevFiles);

      const toDelete = keys.filter(k => k === path || k.startsWith(prefix));
      toDelete.forEach(k => delete updated[k]);

      setOpenFolders(prev => {
        const newOpen = {};
        Object.keys(prev).forEach(k => {
          if (k === path || k.startsWith(prefix)) {
          } else {
            newOpen[k] = prev[k];
          }
        });
        return newOpen;
      });

      if (toDelete.includes(currentFile)) {
        const remaining = Object.keys(updated);
        setCurrentFile(remaining[0] || "");
      }

      return updated;
    });

    setContextMenu(null);
  };

  const fileTree = useMemo(() => {
    const root = {};
    Object.keys(files).forEach(fullPath => {
      const parts = fullPath.split("/");
      let node = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          if (!node._files) node._files = {};
          node._files[part] = { fullPath };
        } else {
          if (!node[part]) node[part] = {};
          node = node[part];
        }
      }
    });
    return root;
  }, [files]);

  const toggleFolder = (path) => {
    setOpenFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-context-menu]")) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderTree = (node, path = "") => {
    const entries = Object.keys(node).filter(k => k !== "_files");
    return (
      <ul className="pl-2">
        {entries.map((entry) => {
          const childPath = path ? `${path}/${entry}` : entry;
          const isOpen = !!openFolders[childPath];
          return (
            <li key={childPath} className="mb-1">
              <div className="flex items-center justify-between relative group">
                <button
                  onClick={() => toggleFolder(childPath)}
                  className="flex items-center gap-2 w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-900"
                >
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <Folder size={14} className="text-blue-400" />
                  {renaming === childPath ? (
                    <input
                      autoFocus
                      data-rename
                      value={renameValue}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleRename(childPath, renameValue)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(childPath, renameValue);
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                      className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-1 rounded w-full ml-1 text-sm"
                    />
                  ) : (
                    <span className="truncate text-gray-800 dark:text-gray-300">{entry}</span>
                  )}
                </button>
                <div className="relative">
                  <button
                    data-context-menu={childPath}
                    className="p-1 rounded opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenu(contextMenu?.path === childPath ? null : { path: childPath });
                    }}
                  >
                    <MoreVertical size={14} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  {contextMenu?.path === childPath && (
                    <div
                      data-context-menu={childPath}
                      className="absolute top-full right-0 mt-1 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded shadow-md w-32 z-50"
                      onMouseLeave={() => setContextMenu(null)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left text-gray-800 dark:text-gray-300"
                        onClick={() => {
                          setRenaming(childPath);
                          setRenameValue(entry);
                          setContextMenu(null);
                        }}
                      >
                        <Pencil size={12} /> Rename
                      </button>
                      <button
                        className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left text-gray-800 dark:text-gray-300"
                        onClick={() => handleDelete(childPath)}
                      >
                        <Trash size={12} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {isOpen && (
                <div className="pl-4">
                  {renderTree(node[entry], childPath)}
                  {node[entry]._files &&
                    Object.keys(node[entry]._files).map(f => {
                      const full = node[entry]._files[f].fullPath;
                      return (
                        <div key={full} className="flex items-center justify-between relative group">
                          <button
                            onClick={() => setCurrentFile(full)}
                            className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded text-sm truncate ${
                              full === currentFile 
                                ? "bg-blue-100 dark:bg-gray-900 text-blue-800 dark:text-white" 
                                : "text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-900"
                            }`}
                          >
                            <FileCode size={12} className="text-blue-400" />
                            <span className="truncate">
                              {renaming === full ? (
                                <input
                                  autoFocus
                                  data-rename
                                  value={renameValue}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  onBlur={() => handleRename(full, renameValue)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleRename(full, renameValue);
                                    if (e.key === 'Escape') setRenaming(null);
                                  }}
                                  className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-1 rounded w-full"
                                />
                              ) : (
                                f
                              )}
                            </span>
                          </button>
                          <div className="relative">
                            <button
                              data-context-menu={full}
                              className="p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setContextMenu(contextMenu?.path === full ? null : { path: full });
                              }}
                            >
                              <MoreVertical size={14} className="text-gray-600 dark:text-gray-400" />
                            </button>
                            {contextMenu?.path === full && (
                              <div
                                data-context-menu={full}
                                className="absolute top-full right-0 mt-1 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded shadow-md w-32 z-50"
                                onMouseLeave={() => setContextMenu(null)}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left text-gray-800 dark:text-gray-300"
                                  onClick={() => {
                                    setRenaming(full);
                                    setRenameValue(f);
                                    setContextMenu(null);
                                  }}
                                >
                                  <Pencil size={12} /> Rename
                                </button>
                                <button
                                  className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left text-gray-800 dark:text-gray-300"
                                  onClick={() => handleDelete(full)}
                                >
                                  <Trash size={12} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </li>
          );
        })}
        {!path && node._files &&
          Object.keys(node._files).map(f => {
            const full = node._files[f].fullPath;
            return (
              <div key={full} className="flex items-center justify-between relative group">
                <button
                  onClick={() => setCurrentFile(full)}
                  className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded text-sm truncate ${
                    full === currentFile 
                      ? "bg-blue-100 dark:bg-gray-900 text-blue-800 dark:text-white" 
                      : "text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-900"
                  }`}
                >
                  <FileCode size={12} className="text-blue-400" />
                  <span className="text-gray-800 dark:text-gray-300">{f}</span>
                </button>
                <div className="relative">
                  <button
                    data-context-menu={full}
                    className="p-1 rounded opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenu(contextMenu?.path === full ? null : { path: full });
                    }}
                  >
                    <MoreVertical size={14} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  {contextMenu?.path === full && (
                    <div
                      data-context-menu={full}
                      className="absolute top-full right-0 mt-1 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded shadow-md w-32 z-50"
                      onMouseLeave={() => setContextMenu(null)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left text-gray-800 dark:text-gray-300"
                        onClick={() => {
                          setRenaming(full);
                          setRenameValue(f);
                          setContextMenu(null);
                        }}
                      >
                        <Pencil size={12} /> Rename
                      </button>
                      <button
                        className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left text-gray-800 dark:text-gray-300"
                        onClick={() => handleDelete(full)}
                      >
                        <Trash size={12} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </ul>
    );
  };

  return (
    <motion.div
      className="relative flex flex-col rounded-xl overflow-hidden shadow-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-black"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.6 }}
    >
      {/* Toolbar */}
      <div className="bg-gray-100 dark:bg-black border-b border-gray-300 dark:border-gray-500 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Code size={16} className="text-blue-400" />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={addNewFile} 
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-300" 
            title="Add new file"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => UpdateFiles({ workspaceId: id, files })}
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-300"
            title="Save"
          >
            <Save size={14} />
          </button>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-[320px_1fr]" style={{ height: "80vh" }}>
        {/* File Explorer */}
        <div className="bg-gray-50 dark:bg-black border-r border-gray-200 dark:border-gray-900 p-2 overflow-auto">
          <h3 className="text-xs text-gray-600 dark:text-gray-400 uppercase mb-2">Files</h3>
          {Object.keys(files).length === 0 ? (
            <div className="text-gray-500 dark:text-gray-600">No files</div>
          ) : (
            <div>{renderTree(fileTree, "")}</div>
          )}
        </div>

        {/* Code Editor */}
        <div className="flex flex-col">
          <div className="bg-gray-100 dark:bg-black border-b border-gray-200 dark:border-gray-900 flex items-center">
            {["code", "preview"].map(tab => (
              <button
                key={tab}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === tab
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "code" ? "Editor" : "Preview"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden min-h-0">
            <AnimatePresence mode="wait">
              {activeTab === "code" ? (
                <motion.div
                  key="code"
                  className="relative h-full w-full flex font-mono text-sm overflow-hidden max-h-[75vh] bg-white dark:bg-black"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Line Numbers */}
                  <div
                    ref={lineNumbersRef}
                    className="bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-600 text-right pr-3 select-none overflow-hidden"
                    style={{ minWidth: "40px" }}
                  >
                    {Array.from({ length: lineCount }).map((_, i) => (
                      <div key={i} className="leading-5">{i + 1}</div>
                    ))}
                  </div>

                  {/* Syntax Highlighted Code */}
                  <pre
                    ref={highlightRef}
                    className="absolute top-0 left-[40px] right-0 bottom-0 pointer-events-none overflow-hidden p-4 whitespace-pre-wrap text-sm"
                    style={{ fontFamily: "monospace" }}
                  />

                  {/* Transparent Editable Layer */}
                  <div
                    ref={editorRef}
                    contentEditable
                    spellCheck={false}
                    onInput={handleEditorChange}
                    onScroll={handleScroll}
                    className="flex-1 p-4 whitespace-pre-wrap focus:outline-none overflow-auto bg-transparent relative z-10 text-transparent caret-black dark:caret-white"
                    style={{
                      tabSize: 2,
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap"
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  className="h-full w-full overflow-auto max-h-[80vh] bg-white dark:bg-gray-900"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <iframe
                    title="preview-frame"
                    className="h-full w-full min-h-[360px]"
                    sandbox="allow-scripts allow-same-origin"
                    srcDoc={`<html><body><script>${files[currentFile]}</script></body></html>`}
                    style={{ border: "none", height: "100%" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-white/50 dark:bg-black/50">
          <Loader2Icon className="h-12 w-12 animate-spin text-blue-500" />
        </div>
      )}
    </motion.div>
  );
}

export default CodeView;