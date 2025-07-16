import React, { useCallback, useEffect, useState } from "react";
import BreadCrumb from "Common/BreadCrumb";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

// icons
import {
  Search,
  Plus,
  Heart,
  MoreHorizontal,
  Eye,
  FileEdit,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Dropdown } from "Common/Components/Dropdown";
import { Link } from "react-router-dom";
import DeleteModal from "Common/DeleteModal";
import Modal from "Common/Components/Modal";

// react-redux
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";

// Formik
import * as Yup from "yup";
import { useFormik } from "formik";

import {
  getAllBlogs,
  addBlog,
  updateBlog,
  deleteBlog,
} from "slices/blog/thunk";
import Dropzone from "react-dropzone";
import { ToastContainer } from "react-toastify";
import { getFirebaseBackend } from "helpers/firebase_helper";
import { getBlogById } from "../../helpers/fakebackend_helper";
import { uploadFiles } from "../../slices/uploadFile/thunk";
import { clearUploadedUrls } from "../../slices/uploadFile/reducer";
import { toast } from "react-hot-toast";
import Pagination from "Common/Pagination";

// Add this interface for the blog section
interface BlogSection {
  contentType: string; // "text", "image", or "video"
  subtitle: string; // Optional subtitle for the section
  content: string; // Text content or image/video URL depending on contentType
  order: number; // Order in which sections should appear
  isPreview?: boolean; // Flag to indicate if the image is a preview
  previewUrl?: string; // URL for previewing the image
  imageCaption?: string; // Optional caption for image content type
}

const Blog = () => {
  const dispatch = useDispatch<any>();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // 6 items per page as requested
  const [show, setShow] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  const [isViewMode, setIsViewMode] = useState<boolean>(false);

  // Blog selector
  const blogSelector = createSelector(
    (state: any) => state.blog,
    (blog) => ({
      blogs: blog.blogs?.results || [],
      totalCount: blog.blogs?.rowCount || 0,
      pageCount: blog.blogs?.totalPages || 1,
      currentApiPage: blog.blogs?.pageNumber || 1,
      loading: blog.loading || false,
      error: blog.error || null,
    })
  );

  const { blogs, totalCount, pageCount, currentApiPage, loading, error } = useSelector(blogSelector);

  const [data, setData] = useState<any[]>([]);
  const [eventData, setEventData] = useState<any>();

  // Add state to store detailed blog information
  const [blogDetails, setBlogDetails] = useState<Record<string, any>>({});

  // Add a state to track which section is currently being edited
  const [activeUploadSection, setActiveUploadSection] = useState<number | null>(
    null
  );

  // Add this to your component
  const fileUploadSelector = createSelector(
    (state: any) => state.uploadFile,
    (uploadFile) => ({
      uploadedUrls: uploadFile.uploadedUrls || [],
      loading: uploadFile.loading || false,
      error: uploadFile.error || null,
    })
  );

  const { uploadedUrls, loading: uploadLoading } =
    useSelector(fileUploadSelector);

  // Dropzone
  const [selectfiles, setSelectfiles] = useState<any>(null);

  // Get Data
  useEffect(() => {
    if (pageCount && currentPage > pageCount) {
      setCurrentPage(1);
      return;
    }

    dispatch(getAllBlogs({ pageNumber: currentPage, pageSize }))
      .unwrap()
      .then((response: any) => {
        if (response.data.results.length === 0 && currentPage > 1) {
          setCurrentPage((prev) => prev - 1);
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to fetch blogs:", error);
      });
  }, [dispatch, currentPage, refreshFlag, pageCount]);

  // Update the useEffect for fetching blog details
  useEffect(() => {
    if (Array.isArray(blogs) && blogs.length > 0) {
      // Create a map to store blog details
      const detailsMap: Record<string, any> = {};

      // Fetch details for each blog
      const fetchPromises = blogs.map((blog: any) =>
        getBlogById(blog.id)
          .then((response: any) => {
            if (response.success && response.data) {
              detailsMap[blog.id] = response.data;
            }
          })
          .catch((error: unknown) => {
            console.error(`Error fetching details for blog ${blog.id}:`, error);
          })
      );

      // When all fetches are complete, update the state
      Promise.all(fetchPromises).then(() => {
        setBlogDetails(detailsMap);
      });
    }
  }, [blogs]);

  // Form validation schema
  const validationSchema = Yup.object({
    Title: Yup.string().required("Please enter title"),
    Description: Yup.string().required("Please enter description"),
    ImageUrl: Yup.string().required("Please upload a thumbnail image"),
    Sections: Yup.array().of(
      Yup.object().shape({
        contentType: Yup.string().required("Content type is required"),
        subtitle: Yup.string(),
        // Make content validation conditional based on content type
        content: Yup.string().when("contentType", {
          is: "text",
          then: (schema) => schema.required("Please enter text content"),
          otherwise: (schema) => schema
        }),
        // Don't require content for image type in validation
        // as it will be set by the upload process
      })
    )
  });

  // Form submission handling
  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      ImageUrl: (eventData && eventData.ImageUrl) || "",
      Title: (eventData && eventData.Title) || "",
      Description: (eventData && eventData.Description) || "",
      Sections: (eventData && eventData.Sections) || [
        { contentType: "text", subtitle: "", content: "", order: 0 },
      ],
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        console.log("onSubmit triggered, processing values...");

        // Check if any image section is missing content
        const hasInvalidImageSection = values.Sections.some(
          (section: BlogSection) => section.contentType === "image" && !section.content && !section.previewUrl
        );

        if (hasInvalidImageSection) {
          toast.error("Please upload images for all image sections");
          return;
        }

        // Process sections to ensure proper order (starting from 1 instead of 0)
        const processedSections = values.Sections.map((section: BlogSection, index: number) => {
          // Make sure content is properly set for image type sections
          let sectionContent = section.content;

          // If it's an image type but content is empty, use the previewUrl if available
          if (section.contentType === "image" && !sectionContent && section.previewUrl) {
            sectionContent = section.previewUrl;
          }

          // Only include necessary fields for the API
          return {
            contentType: section.contentType,
            subtitle: section.subtitle || "",
            content: sectionContent || "",
            order: index + 1 // Start from 1 instead of 0
          };
        });

        if (isEdit) {
          console.log("Updating blog with data:", {
            id: eventData.Id,
            title: values.Title,
            thumbnail: values.ImageUrl,
            description: values.Description,
            sections: processedSections,
          });

          const updateData = {
            id: eventData.Id,
            data: {
              title: values.Title,
              thumbnail: values.ImageUrl,
              description: values.Description,
              sections: processedSections,
            },
          };

          dispatch(updateBlog(updateData))
            .unwrap()
            .then(() => {
              validation.resetForm();
              toggle();
              setRefreshFlag((prev) => !prev);
              toast.success("Blog updated successfully");
            })
            .catch((error: unknown) => {
              console.error("Failed to update blog:", error);
              toast.error("Failed to update blog");
            });
        } else {
          const newData = {
            title: values.Title,
            thumbnail: values.ImageUrl,
            description: values.Description,
            sections: processedSections,
          };

          console.log("Submitting new blog:", newData);

          // Try directly calling the API without using dispatch
          dispatch(addBlog(newData))
            .unwrap()
            .then((response: any) => {
              console.log("Blog added successfully:", response);
              validation.resetForm();
              toggle();
              setRefreshFlag((prev) => !prev);
              toast.success("Blog added successfully");
            })
            .catch((error: unknown) => {
              console.error("Failed to add blog:", error);
              toast.error("Failed to add blog");
            });
        }
      } catch (error) {
        console.error("Error processing form submission:", error);
        toast.error("Error processing form submission");
      }
    },
  });

  // Handle edit click - updated to properly handle sections
  const handleUpdateDataClick = useCallback((data: any) => {
    // Fetch detailed blog data to ensure we have all sections
    getBlogById(data.id)
      .then((response: any) => {
        if (response.success && response.data) {
          const blogData = response.data;

          // Prepare sections with proper order if they exist
          let sections = blogData.sections || [];

          // If no sections but we have blogContent, create a default section
          if (sections.length === 0 && blogData.blogContent) {
            sections = [{
              contentType: "text",
              subtitle: "",
              content: blogData.blogContent,
              order: 1,
            }];
          }

          // Sort sections by order
          sections = sections.sort((a: any, b: any) => a.order - b.order);

          // Set the event data with all details
          setEventData({
            Id: blogData.id,
            Title: blogData.title,
            Description: blogData.blogContent || blogData.description,
            ImageUrl: blogData.thumbnail,
            Sections: sections,
          });

          // Set the image preview if there's an existing image
          if (blogData.thumbnail) {
            setSelectfiles({
              preview: blogData.thumbnail,
              path: blogData.thumbnail.split("/").pop(), // Extract filename from URL
            });
          }

          setIsEdit(true);
          setShow(true);
        }
      })
      .catch((error: unknown) => {
        console.error("Error fetching blog details for edit:", error);
        toast.error("Error fetching blog details");
      });
  }, []);

  // Delete modal toggle
  const deleteToggle = useCallback(() => {
    setDeleteModal(!deleteModal);
  }, [deleteModal]);

  // Handle delete click
  const onClickDelete = useCallback(
    (blog: any) => {
      setSelectedBlog(blog);
      deleteToggle();
    },
    [deleteToggle]
  );

  // Handle delete confirmation
  const handleDelete = useCallback(() => {
    if (selectedBlog) {
      dispatch(deleteBlog(selectedBlog.id))
        .unwrap()
        .then(() => {
          deleteToggle();
          setRefreshFlag((prev) => !prev);
          toast.success("Blog deleted successfully");
        })
        .catch((error: unknown) => {
          console.error("Failed to delete blog:", error);
          toast.error("Failed to delete blog");
        });
    }
  }, [dispatch, selectedBlog, deleteToggle]);

  // Handle view click - updated to properly handle sections
  const handleViewClick = useCallback((data: any) => {
    // First set basic data from the list view
    setEventData({
      ...data,
      Id: data.id,
      Title: data.title,
      Description: data.blogContent || data.description,
      ImageUrl: data.thumbnail || data.imageUrl,
      Author: data.author || "Unknown",
      LastUpdatedAt: data.lastUpdatedAt || new Date().toISOString(),
      Sections: [],
    });

    // Set the image preview if there's an existing image
    if (data.thumbnail || data.imageUrl) {
      setSelectfiles({
        preview: data.thumbnail || data.imageUrl,
        path: (data.thumbnail || data.imageUrl).split("/").pop(), // Extract filename from URL
      });
    }

    // Fetch detailed blog data
    getBlogById(data.id)
      .then((response: any) => {
        if (response.success && response.data) {
          const blogData = response.data;

          // Sort sections by order if they exist
          let sections = blogData.sections || [];
          if (sections.length > 0) {
            sections = sections.sort((a: any, b: any) => a.order - b.order);
          } else {
            // If no sections, create a default section from blogContent
            sections = [{
              contentType: "text",
              subtitle: "",
              content: blogData.blogContent || blogData.description || "",
              order: 0,
            }];
          }

          setEventData((prev: any) => ({
            ...prev,
            Title: blogData.title,
            Description: blogData.blogContent || blogData.description,
            ImageUrl: blogData.thumbnail,
            Author: blogData.author || "Unknown",
            LastUpdatedAt: blogData.lastUpdatedAt,
            Sections: sections,
          }));
        }
      })
      .catch((error: unknown) => {
        console.error("Error fetching blog details:", error);
        toast.error("Error fetching blog details");
      });

    setIsViewMode(true);
    setShow(true);
  }, []);

  // Toggle function for modal
  const toggle = useCallback(() => {
    if (show) {
      setShow(false);
      setEventData(null);
      setSelectfiles(null);
      setIsEdit(false);
      setIsViewMode(false);
      validation.resetForm();
    } else {
      setShow(true);
      setEventData(null);
      setSelectfiles(null);
      validation.resetForm();
    }
  }, [show, validation]);

  // Search functionality: Filters blogs based on user input
  const filterSearchData = (e: any) => {
    const search = e.target.value.toLowerCase().trim();

    if (search === '') {
      // If search is empty, reset to original data from API
      setData([]);
      return;
    }

    // Create a combined filtered result
    const filteredResults = blogs.filter((item: any) => {
      // Check title and description
      const titleMatch = item.title?.toLowerCase().includes(search);
      const descriptionMatch = item.description?.toLowerCase().includes(search);

      // Check author from detailed data
      const details = blogDetails[item.id];
      const authorMatch = details?.author?.toLowerCase().includes(search);

      // Return true if any field matches
      return titleMatch || descriptionMatch || authorMatch;
    });

    // Update the UI with filtered results
    setData(filteredResults);
  };

  // Pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // File upload handling function
  const formatBytes = (bytes: any, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // File upload handling function
  const handleFileUpload = (files: File[], sectionIndex?: number) => {
    if (files && files.length > 0) {
      // Set the active section if provided
      if (sectionIndex !== undefined) {
        setActiveUploadSection(sectionIndex);
      } else {
        setActiveUploadSection(null);

        // For thumbnail, set the file directly in the form values
        validation.setFieldValue("ImageUrl", files[0]);
      }

      // Create a preview immediately for better UX
      const file = files[0];
      const preview = URL.createObjectURL(file);
      const formattedSize = formatBytes(file.size);

      // If it's for thumbnail (no section index provided)
      if (sectionIndex === undefined) {
        setSelectfiles({
          preview,
          formattedSize,
          name: file.name,
        });

        // Upload thumbnail directly to Firebase
        const firebaseBackend = getFirebaseBackend();
        toast.loading("Uploading thumbnail...", { id: "uploading" });

        firebaseBackend.uploadBlogImage(file)
          .then((downloadURL: string) => {
            validation.setFieldValue("ImageUrl", downloadURL);
            setSelectfiles({
              preview: downloadURL,
              formattedSize,
              name: file.name,
            });
            toast.dismiss("uploading");
            toast.success("Thumbnail uploaded successfully");
          })
          .catch((error: unknown) => {
            console.error("Error uploading thumbnail:", error);
            toast.dismiss("uploading");
            toast.error("Failed to upload thumbnail");
          });
      } else {
        // For section images, immediately update the UI with the preview
        const updatedSections = [...validation.values.Sections];
        if (updatedSections[sectionIndex]) {
          // Store the preview URL temporarily
          updatedSections[sectionIndex] = {
            ...updatedSections[sectionIndex],
            previewUrl: preview,
            isPreview: true,
          };
          validation.setFieldValue("Sections", updatedSections);
        }

        // Upload section image directly to Firebase
        const firebaseBackend = getFirebaseBackend();
        toast.loading("Uploading image...", { id: "uploading" });

        firebaseBackend.uploadBlogImage(file)
          .then((downloadURL: string) => {
            const updatedSections = [...validation.values.Sections];
            if (updatedSections[sectionIndex]) {
              updatedSections[sectionIndex] = {
                ...updatedSections[sectionIndex],
                content: downloadURL,
                previewUrl: downloadURL,
                isPreview: false,
              };
              validation.setFieldValue("Sections", updatedSections);
            }
            toast.dismiss("uploading");
            toast.success("Section image uploaded successfully");
          })
          .catch((error: unknown) => {
            console.error("Error uploading section image:", error);
            toast.dismiss("uploading");
            toast.error("Failed to upload section image");
          });
      }
    }
  };

  // Action dropdown
  const dropdownItems = (item: any) => (
    <ul className="py-1">
      <li>
        <Link
          className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 dropdown-item hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200"
          to="#!"
          onClick={() => handleViewClick(item)}
        >
          <Eye className="inline-block size-3 mr-1" />{" "}
          <span className="align-middle">View</span>
        </Link>
      </li>
      <li>
        <Link
          className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 dropdown-item hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200"
          to="#!"
          onClick={() => handleUpdateDataClick(item)}
        >
          <FileEdit className="inline-block size-3 mr-1" />{" "}
          <span className="align-middle">Edit</span>
        </Link>
      </li>
      <li>
        <Link
          className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 dropdown-item hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200"
          to="#!"
          onClick={() => onClickDelete(item)}
        >
          <Trash2 className="inline-block size-3 mr-1" />{" "}
          <span className="align-middle">Delete</span>
        </Link>
      </li>
    </ul>
  );

  // Favorite button handler
  const btnFav = (target: any) => {
    target.closest(".toggle-button").classList.toggle("active");
  };

  // Render section content based on content type
  const renderSectionContent = (section: BlogSection, index: number) => {
    if (section.contentType === "image") {
      return (
        <div>
          <label className="inline-block mb-2 text-sm font-medium">
            Image <span className="text-red-500">*</span>
          </label>
          {isViewMode ? (
            <div className="p-3 border rounded-md bg-white dark:bg-zink-600 dark:border-zink-500">
              {section.content && (
                <img
                  src={section.content}
                  alt="Section image"
                  className="max-w-full h-auto max-h-40"
                />
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center border rounded-md cursor-pointer bg-white dropzone border-slate-200 dark:bg-zink-600 dark:border-zink-500 dz-clickable">
                <Dropzone
                  onDrop={(acceptedFiles) => {
                    handleFileUpload(acceptedFiles, index);
                  }}
                >
                  {({ getRootProps, getInputProps }) => (
                    <div
                      className="w-full py-5 text-lg text-center dz-message needsclick"
                      {...getRootProps()}
                    >
                      <input {...getInputProps()} />
                      <div className="mb-3">
                        <UploadCloud className="block size-12 mx-auto text-slate-500 fill-slate-200 dark:text-zink-200 dark:fill-zink-500" />
                      </div>
                      <h5 className="mb-0 font-normal text-slate-500 text-15">Drag and drop your image or <a href="#!">browse</a> your files</h5>
                    </div>
                  )}
                </Dropzone>
              </div>
              {(section.previewUrl || section.content) && (
                <div className="mt-2">
                  <div className="border rounded border-slate-200 dark:border-zink-500">
                    <div className="flex p-2">
                      <div className="shrink-0 me-3">
                        <div className="p-2 rounded-md size-14 bg-white dark:bg-zink-600">
                          <img
                            className="block w-full h-full rounded-md"
                            src={section.previewUrl || section.content}
                            alt="Section image"
                          />
                        </div>
                      </div>
                      <div className="grow">
                        <div className="pt-1">
                          <h5 className="mb-1 text-15">Section Image</h5>
                          <p className="mb-0 text-slate-500 dark:text-zink-200">
                            {section.isPreview ? "Preview (uploading...)" : "Image uploaded successfully"}
                          </p>
                        </div>
                      </div>
                      {uploadLoading && activeUploadSection === index && (
                        <div className="shrink-0 ms-3 flex items-center">
                          <div className="animate-spin size-5 border-2 border-slate-200 border-t-custom-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <p className="mt-2 text-sm text-slate-500 dark:text-zink-200">
                Note: The image URL will be automatically set as the content when uploaded.
              </p>
            </>
          )}
        </div>
      );
    } else {
      return (
        <textarea
          className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
          placeholder="Enter content"
          name={`Sections[${index}].content`}
          rows={4}
          value={section.content}
          onChange={validation.handleChange}
          onBlur={validation.handleBlur}
          disabled={isViewMode}
        ></textarea>
      );
    }
  };

  // Modal content
  const renderModalContent = () => (
    <Modal.Body className="max-h-[calc(theme('height.screen')_-_100px)] p-4 overflow-y-auto">
      <form
        action="#!"
        onSubmit={(e) => {
          e.preventDefault();
          if (!isViewMode) {
            console.log("Form submitted, values:", validation.values);
            validation.handleSubmit();
          }
          return false;
        }}
      >
        <div className="mb-3">
          <label className="inline-block mb-2 text-base font-medium">
            Thumbnail <span className="text-red-500">*</span>
          </label>
          {isViewMode ? (
            <div className="p-3 border rounded-md bg-white dark:bg-zink-600 dark:border-zink-500">
              {eventData?.ImageUrl && (
                <img
                  src={eventData.ImageUrl}
                  alt="Thumbnail"
                  className="max-w-full h-auto max-h-40"
                />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center border rounded-md cursor-pointer bg-white dropzone border-slate-200 dark:bg-zink-600 dark:border-zink-500 dz-clickable">
              <Dropzone
                onDrop={(acceptedFiles) => {
                  handleFileUpload(acceptedFiles);
                }}
              >
                {({ getRootProps, getInputProps }) => (
                  <div
                    className="w-full py-5 text-lg text-center dz-message needsclick"
                    {...getRootProps()}
                  >
                    <input {...getInputProps()} />
                    <div className="mb-3">
                      <UploadCloud className="block size-12 mx-auto text-slate-500 fill-slate-200 dark:text-zink-200 dark:fill-zink-500" />
                    </div>
                    <h5 className="mb-0 font-normal text-slate-500 text-15">Drag and drop your thumbnail or <a href="#!">browse</a> your files</h5>
                  </div>
                )}
              </Dropzone>
            </div>
          )}
          {!isViewMode &&
            (selectfiles?.preview || validation.values.ImageUrl) && (
              <div className="mt-2">
                <div className="border rounded border-slate-200 dark:border-zink-500">
                  <div className="flex p-2">
                    <div className="shrink-0 me-3">
                      <div className="p-2 rounded-md size-14 bg-white">
                        <img
                          className="block w-full h-full rounded-md"
                          src={
                            selectfiles?.preview || validation.values.ImageUrl
                          }
                          alt="Thumbnail"
                        />
                      </div>
                    </div>
                    <div className="grow">
                      <div className="pt-1">
                        <h5 className="mb-1 text-15">
                          {selectfiles?.name || "Thumbnail"}
                        </h5>
                        <p className="mb-0 text-slate-500 dark:text-zink-200">
                          {selectfiles?.formattedSize ||
                            "Image uploaded successfully"}
                        </p>
                      </div>
                    </div>
                    {uploadLoading && activeUploadSection === null && (
                      <div className="shrink-0 ms-3 flex items-center">
                        <div className="animate-spin size-5 border-2 border-slate-200 border-t-custom-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          {!isViewMode &&
            validation.touched.ImageUrl &&
            validation.errors.ImageUrl ? (
            <p className="text-red-400">{String(validation.errors.ImageUrl)}</p>
          ) : null}
        </div>

        <div className="mb-3">
          <label className="inline-block mb-2 text-base font-medium">
            Title <span className="text-red-500">*</span>
          </label>
          {isViewMode ? (
            <div className="p-3 border rounded-md bg-white dark:bg-zink-600 dark:border-zink-500">
              {validation.values.Title}
            </div>
          ) : (
            <input
              type="text"
              className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
              placeholder="Enter blog title"
              name="Title"
              value={validation.values.Title}
              onChange={validation.handleChange}
              onBlur={validation.handleBlur}
            />
          )}
          {!isViewMode &&
            validation.touched.Title &&
            validation.errors.Title ? (
            <p className="text-red-400">{validation.errors.Title as string}</p>
          ) : null}
        </div>

        <div className="mb-3">
          <label className="inline-block mb-2 text-base font-medium">
            Description <span className="text-red-500">*</span>
          </label>
          {isViewMode ? (
            <div className="p-3 border rounded-md bg-white dark:bg-zink-600 dark:border-zink-500">
              {validation.values.Description}
            </div>
          ) : (
            <textarea
              className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
              placeholder="Enter blog description"
              name="Description"
              rows={3}
              value={validation.values.Description}
              onChange={validation.handleChange}
              onBlur={validation.handleBlur}
            ></textarea>
          )}
          {!isViewMode &&
            validation.touched.Description &&
            validation.errors.Description ? (
            <p className="text-red-400">
              {validation.errors.Description as string}
            </p>
          ) : null}
        </div>

        <div className="mb-3">
          <label className="inline-block mb-2 text-base font-medium">
            Content Sections <span className="text-red-500">*</span>
          </label>

          {validation.values.Sections.map(
            (section: BlogSection, index: number) => (
              <div
                key={index}
                className="p-4 mb-4 border rounded-md border-slate-200 dark:border-zink-500"
              >
                <div className="flex justify-between mb-3">
                  <h5 className="text-base font-medium">Section {index + 1}</h5>
                  {!isViewMode && validation.values.Sections.length > 1 && (
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => {
                        const updatedSections = [...validation.values.Sections];
                        updatedSections.splice(index, 1);
                        validation.setFieldValue("Sections", updatedSections);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>

                {!isViewMode && (
                  <div className="mb-3">
                    <label className="inline-block mb-2 text-sm font-medium">
                      Content Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                      name={`Sections[${index}].contentType`}
                      value={section.contentType}
                      onChange={(e) => {
                        // First handle the change event
                        validation.handleChange(e);

                        // Then manually update the section with the new content type
                        const newContentType = e.target.value;
                        const updatedSections = [...validation.values.Sections];
                        updatedSections[index] = {
                          ...updatedSections[index],
                          contentType: newContentType,
                          content: "", // Reset content when changing type
                          imageCaption: "", // Reset image caption when changing type
                        };
                        validation.setFieldValue("Sections", updatedSections);
                      }}
                      onBlur={validation.handleBlur}
                    >
                      <option value="text">Text</option>
                      <option value="image">Image</option>
                    </select>
                  </div>
                )}

                <div className="mb-3">
                  <label className="inline-block mb-2 text-sm font-medium">
                    Subtitle
                  </label>
                  {isViewMode ? (
                    <div className="p-3 border rounded-md bg-white dark:bg-zink-600 dark:border-zink-500">
                      {section.subtitle || "No subtitle"}
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                      placeholder="Enter subtitle (optional)"
                      name={`Sections[${index}].subtitle`}
                      value={section.subtitle}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                    />
                  )}
                </div>

                <div className="mb-3">
                  <label className="inline-block mb-2 text-sm font-medium">
                    {section.contentType === "image" ? (
                      ""  // Changed label for image type
                    ) : (
                      <>Content <span className="text-red-500">*</span></>
                    )}
                  </label>
                  {renderSectionContent(section, index)}
                  {!isViewMode &&
                    validation.touched.Sections &&
                    validation.errors.Sections &&
                    (validation.errors.Sections as any)[index]?.content ? (
                    <p className="text-red-400">
                      {(validation.errors.Sections as any)[index]?.content}
                    </p>
                  ) : null}
                </div>
              </div>
            )
          )}

          {!isViewMode && (
            <button
              type="button"
              className="px-3 py-2 text-sm font-medium text-white transition-all duration-200 ease-linear rounded-md bg-custom-500 border-custom-500 hover:text-white hover:bg-custom-600 hover:border-custom-600 focus:text-white focus:bg-custom-600 focus:border-custom-600 focus:ring focus:ring-custom-100 active:text-white active:bg-custom-600 active:border-custom-600 active:ring active:ring-custom-100 dark:ring-custom-400/20"
              onClick={() => {
                const updatedSections = [...validation.values.Sections];
                updatedSections.push({
                  contentType: "text",
                  subtitle: "",
                  content: "",
                  order: updatedSections.length + 1,
                });
                validation.setFieldValue("Sections", updatedSections);
              }}
            >
              <Plus className="inline-block size-4 mr-1" /> Add Section
            </button>
          )}
        </div>

        {isViewMode && eventData && (
          <div className="mt-4 text-sm text-slate-500 dark:text-zink-200">
            <p>Author: {eventData.Author || "Unknown"}</p>
            <p>
              Last Updated: {new Date(eventData.LastUpdatedAt).toLocaleString()}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            className="text-white btn bg-slate-500 border-slate-500 hover:text-white hover:bg-slate-600 hover:border-slate-600 focus:text-white focus:bg-slate-600 focus:border-slate-600 focus:ring focus:ring-slate-100 active:text-white active:bg-slate-600 active:border-slate-600 active:ring active:ring-slate-100 dark:ring-slate-400/10"
            onClick={toggle}
          >
            {isViewMode ? "Close" : "Cancel"}
          </button>
          {!isViewMode && (
            <button
              type="submit"
              className="text-white btn bg-custom-500 border-custom-500 hover:text-white hover:bg-custom-600 hover:border-custom-600 focus:text-white focus:bg-custom-600 focus:border-custom-600 focus:ring focus:ring-custom-100 active:text-white active:bg-custom-600 active:border-custom-600 active:ring active:ring-custom-100 dark:ring-custom-400/20"
            >
              {isEdit ? "Update" : "Add"} Blog
            </button>
          )}
        </div>
      </form>
    </Modal.Body>
  );

  return (
    <React.Fragment>
      <BreadCrumb title="Blog" pageTitle="Ecommerce" />
      <DeleteModal
        show={deleteModal}
        onHide={deleteToggle}
        onDelete={handleDelete}
      />
      <ToastContainer closeButton={false} />
      <div className="card">
        <div className="card-body">
          <div className="grid items-center grid-cols-1 gap-4 2xl:grid-cols-12">
            <div className="2xl:col-span-3">
            </div>
            <div className="2xl:col-span-9">
              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                <div className="relative grow md:grow-0">
                  <input
                    type="text"
                    className="ltr:pl-8 rtl:pr-8 search form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                    placeholder="Search for blog"
                    autoComplete="off"
                    onChange={filterSearchData}
                  />
                  <Search className="inline-block size-4 absolute ltr:left-2.5 rtl:right-2.5 top-2.5 text-slate-500 dark:text-zink-200 fill-slate-100 dark:fill-zink-600" />
                </div>
                <button
                  type="button"
                  className="text-white btn bg-custom-500 border-custom-500 hover:text-white hover:bg-custom-600 hover:border-custom-600 focus:text-white focus:bg-custom-600 focus:border-custom-600 focus:ring focus:ring-custom-100 active:text-white active:bg-custom-600 active:border-custom-600 active:ring active:ring-custom-100 dark:ring-custom-400/20"
                  onClick={toggle}
                >
                  <Plus className="inline-block size-4 align-middle ltr:mr-1 rtl:ml-1" />{" "}
                  <span className="align-middle">Add Blog</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="!p-0 card-body">
          <div className="overflow-x-auto">
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-zink-500 table-fixed">
                  <thead className="bg-white dark:bg-zink-600">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-xs font-medium text-left text-slate-500 dark:text-zink-200 uppercase">
                        Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium text-left text-slate-500 dark:text-zink-200 uppercase">
                        Description
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium text-left text-slate-500 dark:text-zink-200 uppercase">
                        Author
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium text-left text-slate-500 dark:text-zink-200 uppercase">
                        Last Updated
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium text-center text-slate-500 dark:text-zink-200 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zink-500">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin size-6 border-2 border-slate-200 border-t-custom-500 rounded-full"></div>
                          </div>
                        </td>
                      </tr>
                    ) : (data.length > 0 ? data : blogs).length > 0 ? (
                      (data.length > 0 ? data : blogs).map((item: any, index: number) => {
                        // Get detailed info if available
                        const details = blogDetails[item.id] || {};
                        return (
                          <tr key={index} className="hover:bg-slate-50 dark:hover:bg-zink-500">
                            <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-zink-100">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-md bg-slate-100 dark:bg-zink-600 shrink-0">
                                  {item.thumbnail && (
                                    <img
                                      src={item.thumbnail}
                                      alt={item.title}
                                      className="h-10 w-10 object-cover rounded-md"
                                    />
                                  )}
                                </div>
                                <div className="grow">
                                  <h6 className="mb-0 text-15">{item.title}</h6>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-zink-200">
                              {item.description?.length > 100
                                ? `${item.description.substring(0, 100)}...`
                                : item.description}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-zink-200">
                              {details.author || item.author || "Unknown"}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-zink-200">
                              {details.lastUpdatedAt
                                ? new Date(details.lastUpdatedAt).toLocaleDateString()
                                : new Date(item.createdAt).toLocaleDateString()}
                            </td>
                            <td className="relative px-6 py-4 text-center text-sm font-medium">
                              <div className="flex items-center justify-center gap-2">
                                {/* View button */}
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center size-8 p-0 text-blue-500 transition-colors duration-150 rounded-md bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-zink-600 dark:text-blue-400 dark:hover:bg-zink-500"
                                  onClick={() => handleViewClick(item)}
                                  title="View"
                                >
                                  <Eye className="size-4" />
                                </button>

                                {/* Edit button */}
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center size-8 p-0 text-amber-500 transition-colors duration-150 rounded-md bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300 dark:bg-zink-600 dark:text-amber-400 dark:hover:bg-zink-500"
                                  onClick={() => handleUpdateDataClick(item)}
                                  title="Edit"
                                >
                                  <FileEdit className="size-4" />
                                </button>

                                {/* Delete button */}
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center size-8 p-0 text-red-500 transition-colors duration-150 rounded-md bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300 dark:bg-zink-600 dark:text-red-400 dark:hover:bg-zink-500"
                                  onClick={() => onClickDelete(item)}
                                  title="Delete"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center">
                          <p className="text-slate-500 dark:text-zink-200">No blogs found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {blogs.length > 0 && (
            <div className="flex flex-col items-center mb-5 md:flex-row p-4">
              <div className="mb-4 grow md:mb-0">
                <p className="text-slate-500 dark:text-zink-200">
                  Showing <b>{Math.min((data.length > 0 ? data : blogs).length, pageSize)}</b> results
                </p>
              </div>
              <ul className="flex flex-wrap items-center gap-2 shrink-0">
                {/* First page button */}
                <li>
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center h-8 px-3 transition-all duration-150 ease-linear border rounded ${currentPage <= 1
                      ? "text-slate-400 dark:text-zink-300 cursor-not-allowed border-slate-200 dark:border-zink-500 bg-white dark:bg-zink-700"
                      : "border-blue-500 dark:border-blue-500 text-blue-500 dark:text-blue-400 hover:text-white dark:hover:text-white hover:bg-blue-600 dark:hover:bg-blue-600 focus:bg-blue-600 dark:focus:bg-blue-600 focus:text-white dark:focus:text-white bg-white dark:bg-zink-700"
                      }`}
                    onClick={() => currentPage > 1 && setCurrentPage(1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronsLeft className="size-4 rtl:rotate-180" />
                  </button>
                </li>

                {/* Previous button */}
                <li>
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center h-8 px-3 transition-all duration-150 ease-linear border rounded ${currentPage <= 1
                      ? "text-slate-400 dark:text-zink-300 cursor-not-allowed border-slate-200 dark:border-zink-500 bg-white dark:bg-zink-700"
                      : "border-blue-500 dark:border-blue-500 text-blue-500 dark:text-blue-400 hover:text-white dark:hover:text-white hover:bg-blue-600 dark:hover:bg-blue-600 focus:bg-blue-600 dark:focus:bg-blue-600 focus:text-white dark:focus:text-white bg-white dark:bg-zink-700"
                      }`}
                    onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="size-4 mr-1 rtl:rotate-180" /> Prev
                  </button>
                </li>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                  // Show pages around current page
                  let pageNum;
                  if (pageCount <= 5) {
                    // If 5 or fewer pages, show all
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    // If near start, show first 5 pages
                    pageNum = i + 1;
                  } else if (currentPage >= pageCount - 2) {
                    // If near end, show last 5 pages
                    pageNum = pageCount - 4 + i;
                  } else {
                    // Otherwise show current page and 2 pages on each side
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <li key={pageNum}>
                      <button
                        type="button"
                        className={`inline-flex items-center justify-center h-8 px-3 transition-all duration-150 ease-linear border rounded ${currentPage === pageNum
                          ? "text-white bg-blue-600 border-blue-600 hover:text-white dark:text-white dark:bg-blue-600 dark:border-blue-600 dark:hover:text-white"
                          : "bg-white dark:bg-zink-700 border-blue-500 dark:border-blue-500 text-blue-500 dark:text-blue-400 hover:text-white dark:hover:text-white hover:bg-blue-600 dark:hover:bg-blue-600 focus:bg-blue-600 dark:focus:bg-blue-600 focus:text-white dark:focus:text-white"
                          }`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    </li>
                  );
                })}

                {/* Next button */}
                <li>
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center h-8 px-3 transition-all duration-150 ease-linear border rounded ${currentPage >= pageCount
                      ? "text-slate-400 dark:text-zink-300 cursor-not-allowed border-slate-200 dark:border-zink-500 bg-white dark:bg-zink-700"
                      : "border-blue-500 dark:border-blue-500 text-blue-500 dark:text-blue-400 hover:text-white dark:hover:text-white hover:bg-blue-600 dark:hover:bg-blue-600 focus:bg-blue-600 dark:focus:bg-blue-600 focus:text-white dark:focus:text-white bg-white dark:bg-zink-700"
                      }`}
                    onClick={() => currentPage < pageCount && setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= pageCount}
                  >
                    Next <ChevronRight className="size-4 ml-1 rtl:rotate-180" />
                  </button>
                </li>

                {/* Last page button */}
                <li>
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center h-8 px-3 transition-all duration-150 ease-linear border rounded ${currentPage >= pageCount
                      ? "text-slate-400 dark:text-zink-300 cursor-not-allowed border-slate-200 dark:border-zink-500 bg-white dark:bg-zink-700"
                      : "border-blue-500 dark:border-blue-500 text-blue-500 dark:text-blue-400 hover:text-white dark:hover:text-white hover:bg-blue-600 dark:hover:bg-blue-600 focus:bg-blue-600 dark:focus:bg-blue-600 focus:text-white dark:focus:text-white bg-white dark:bg-zink-700"
                      }`}
                    onClick={() => currentPage < pageCount && setCurrentPage(pageCount)}
                    disabled={currentPage >= pageCount}
                  >
                    <ChevronsRight className="size-4 rtl:rotate-180" />
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <Modal
        show={show}
        onHide={toggle}
        modal-center="true"
        className="fixed flex flex-col transition-all duration-300 ease-in-out left-2/4 z-drawer -translate-x-2/4 -translate-y-2/4"
        dialogClassName="w-screen md:w-[30rem] bg-white shadow rounded-md dark:bg-zink-600"
      >
        <Modal.Header
          className="flex items-center justify-between p-4 border-b dark:border-zink-500"
          closeButtonClass="transition-all duration-200 ease-linear text-slate-400 hover:text-red-500"
        >
          <Modal.Title className="text-16">
            {isEdit ? "Edit" : isViewMode ? "View" : "Add"} Blog
          </Modal.Title>
        </Modal.Header>
        {renderModalContent()}
      </Modal>
    </React.Fragment>
  );
};

export default Blog;
