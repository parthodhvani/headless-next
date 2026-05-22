"use client";

import { useState } from "react";

export default function AuthPopup({
  onClose,
  onSuccess
}) {

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({});

  const [preview, setPreview] = useState("");

  const [coverPreview, setCoverPreview] = useState("");

  const [form, setForm] = useState({

    name: "",
    email: "",
    password: "",

    phone: "",
    profession: "",
    company: "",
    location: "",
    website: "",
    bio: "",

    image: null,
    cover_image: null

  });

  /* =========================
      VALIDATION
  ========================= */

const validateForm = () => {

  const newErrors = {};

  /* =========================
      NAME
  ========================= */

  if (!form.name.trim()) {

    newErrors.name =
      "Full name is required";

  } else if (form.name.trim().length < 3) {

    newErrors.name =
      "Name must be at least 3 characters";

  } else if (
    !/^[a-zA-Z\s]+$/.test(form.name)
  ) {

    newErrors.name =
      "Only letters allowed";

  }

  /* =========================
      EMAIL
  ========================= */

  if (!form.email.trim()) {

    newErrors.email =
      "Email address is required";

  } else if (
    !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
      form.email
    )
  ) {

    newErrors.email =
      "Please enter valid email";

  }

  /* =========================
      PASSWORD
  ========================= */

  if (!form.password) {

    newErrors.password =
      "Password is required";

  } else if (form.password.length < 8) {

    newErrors.password =
      "Minimum 8 characters required";

  } else if (
    !/(?=.*[a-z])/.test(form.password)
  ) {

    newErrors.password =
      "Add at least 1 lowercase letter";

  } else if (
    !/(?=.*[A-Z])/.test(form.password)
  ) {

    newErrors.password =
      "Add at least 1 uppercase letter";

  } else if (
    !/(?=.*[0-9])/.test(form.password)
  ) {

    newErrors.password =
      "Add at least 1 number";

  } else if (
    !/(?=.*[!@#$%^&*])/.test(form.password)
  ) {

    newErrors.password =
      "Add at least 1 special character";

  }

  /* =========================
      PHONE
  ========================= */

  if (!form.phone.trim()) {

    newErrors.phone =
      "Phone number is required";

  } else if (
    !/^[0-9]{10,15}$/.test(form.phone)
  ) {

    newErrors.phone =
      "Phone must be 10 to 15 digits";

  }

  /* =========================
      LOCATION
  ========================= */

  if (!form.location.trim()) {

    newErrors.location =
      "Location is required";

  } else if (
    form.location.trim().length < 2
  ) {

    newErrors.location =
      "Invalid location";

  }

  /* =========================
      PROFESSION
  ========================= */

  if (!form.profession.trim()) {

    newErrors.profession =
      "Profession is required";

  }

  /* =========================
      COMPANY
  ========================= */

  if (!form.company.trim()) {

    newErrors.company =
      "Company name is required";

  }

  /* =========================
      WEBSITE
  ========================= */

  if (!form.website.trim()) {

    newErrors.website =
      "Website is required";

  } else if (
    !/^https?:\/\/.+/i.test(
      form.website
    )
  ) {

    newErrors.website =
      "Website must start with https://";

  }

  /* =========================
      BIO
  ========================= */

  if (!form.bio.trim()) {

    newErrors.bio =
      "Bio is required";

  } else if (
    form.bio.trim().length < 20
  ) {

    newErrors.bio =
      "Bio must be at least 20 characters";

  } else if (
    form.bio.length > 300
  ) {

    newErrors.bio =
      "Bio cannot exceed 300 characters";

  }

  /* =========================
      PROFILE IMAGE
  ========================= */

  if (!form.image) {

    newErrors.image =
      "Profile image is required";

  } else {

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (
      !allowedTypes.includes(
        form.image.type
      )
    ) {

      newErrors.image =
        "Only JPG PNG WEBP allowed";

    }

    if (
      form.image.size >
      2 * 1024 * 1024
    ) {

      newErrors.image =
        "Image must be under 2MB";

    }

  }

  /* =========================
      COVER IMAGE
  ========================= */

  if (form.cover_image) {

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (
      !allowedTypes.includes(
        form.cover_image.type
      )
    ) {

      newErrors.cover_image =
        "Only JPG PNG WEBP allowed";

    }

    if (
      form.cover_image.size >
      5 * 1024 * 1024
    ) {

      newErrors.cover_image =
        "Cover image must be under 5MB";

    }

  }

  /* =========================
      SAVE ERRORS
  ========================= */

  setErrors(newErrors);

  return Object.keys(newErrors).length === 0;

};

  /* =========================
      SUBMIT
  ========================= */

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {

      const data = new FormData();

      Object.keys(form).forEach((key) => {

        if (form[key] !== null) {

          data.append(key, form[key]);

        }

      });

      const res = await fetch(

        "http://localhost/headless/wp-json/custom/v1/signup",

        {
          method: "POST",
          body: data
        }

      );

      const result = await res.json();

      if (!result.success) {

        alert(result.message);

        setLoading(false);

        return;

      }

      localStorage.setItem(
        "aiUser",
        JSON.stringify(result.user)
      );

      onSuccess(result.user);

      onClose();

    } catch (err) {

      console.log(err);

      alert("Signup failed");

    }

    setLoading(false);

  };

  return (

    <div className="ultra-auth">

      {/* BACKDROP */}

      <div
        className="ultra-auth__backdrop"
        onClick={onClose}
      />

      {/* CARD */}

      <div className="ultra-auth__card">

        <div className="ultra-auth__noise"></div>

        <div className="ultra-auth__glow ultra-auth__glow--1"></div>

        <div className="ultra-auth__glow ultra-auth__glow--2"></div>

        {/* CLOSE */}

        <button
          className="ultra-auth__close"
          onClick={onClose}
        >
          ×
        </button>

        {/* LEFT */}

        <div className="ultra-auth__left">

          <div className="ultra-auth__branding">

            <div className="ultra-auth__logo">
              ✦
            </div>

            <h2>
              Create Your
              <span> AI Identity</span>
            </h2>

            <p>
              Enter the futuristic ecosystem.
              Build your intelligent profile
              and unlock premium AI access.
            </p>

          </div>

          <div className="ultra-auth__visual">

            <div className="ultra-auth__planet"></div>

            <div className="ultra-auth__ring"></div>

            <div className="ultra-auth__floating-card">

              <strong>AI VERIFIED</strong>

              <span>
                Secure neural profile active
              </span>

            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className="ultra-auth__right">

          <form
            className="ultra-auth__form"
            onSubmit={handleSubmit}
          >

            {/* PROFILE PHOTO */}

            <div className="ultra-auth__avatar-wrap">

              <label
                htmlFor="avatar"
                className="ultra-auth__avatar"
              >

                {
                  preview
                    ? (
                      <img
                        src={preview}
                        alt="preview"
                        className="ultra-auth__avatar-img"
                      />
                    )
                    : (
                      <span>+</span>
                    )
                }

              </label>

              <input
                hidden
                id="avatar"
                type="file"
                accept="image/*"
                onChange={(e) => {

                  const file =
                    e.target.files[0];

                  if (!file) return;

                  setPreview(
                    URL.createObjectURL(file)
                  );

                  setForm({
                    ...form,
                    image: file
                  });

                  setErrors({
                    ...errors,
                    image: ""
                  });

                }}
              />

              <p>
                Upload Profile Photo
              </p>

              {
                errors.image &&
                <span className="form-error">
                  {errors.image}
                </span>
              }

            </div>

            {/* COVER */}

            <div className="ultra-auth__cover">

              {
                coverPreview && (
                  <img
                    src={coverPreview}
                    alt="cover"
                    className="ultra-auth__cover-preview"
                  />
                )
              }

              <label htmlFor="cover">

                Upload Cover Image

              </label>

              <input
                hidden
                id="cover"
                type="file"
                accept="image/*"
                onChange={(e) => {

                  const file =
                    e.target.files[0];

                  if (!file) return;

                  setCoverPreview(
                    URL.createObjectURL(file)
                  );

                  setForm({
                    ...form,
                    cover_image: file
                  });

                }}
              />

            </div>

            {/* GRID */}

            <div className="ultra-auth__grid2">

              {/* NAME */}

              <div>

                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e)=>
                    setForm({
                      ...form,
                      name:e.target.value
                    })
                  }
                />

                {
                  errors.name &&
                  <span className="form-error">
                    {errors.name}
                  </span>
                }

              </div>

              {/* EMAIL */}

              <div>

                <input
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(e)=>
                    setForm({
                      ...form,
                      email:e.target.value
                    })
                  }
                />

                {
                  errors.email &&
                  <span className="form-error">
                    {errors.email}
                  </span>
                }

              </div>

              {/* PHONE */}

              <div>

                <input
                  type="text"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={(e)=>
                    setForm({
                      ...form,
                      phone:e.target.value
                    })
                  }
                />

                {
                  errors.phone &&
                  <span className="form-error">
                    {errors.phone}
                  </span>
                }

              </div>

              {/* LOCATION */}

              <div>

                <input
                  type="text"
                  placeholder="Location"
                  value={form.location}
                  onChange={(e)=>
                    setForm({
                      ...form,
                      location:e.target.value
                    })
                  }
                />

              </div>

              {/* PROFESSION */}

              <div>

                <input
                  type="text"
                  placeholder="Profession"
                  value={form.profession}
                  onChange={(e)=>
                    setForm({
                      ...form,
                      profession:e.target.value
                    })
                  }
                />

              </div>

              {/* COMPANY */}

              <div>

                <input
                  type="text"
                  placeholder="Company"
                  value={form.company}
                  onChange={(e)=>
                    setForm({
                      ...form,
                      company:e.target.value
                    })
                  }
                />

              </div>

              {/* WEBSITE */}

              <div>

                <input
                  type="text"
                  placeholder="Website"
                  value={form.website}
                  onChange={(e)=>
                    setForm({
                      ...form,
                      website:e.target.value
                    })
                  }
                />

                {
                  errors.website &&
                  <span className="form-error">
                    {errors.website}
                  </span>
                }

              </div>

              {/* PASSWORD */}

              <div>

                <input
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e)=>
                    setForm({
                      ...form,
                      password:e.target.value
                    })
                  }
                />

                {
                  errors.password &&
                  <span className="form-error">
                    {errors.password}
                  </span>
                }

              </div>

            </div>

            {/* BIO */}

            <div>

              <textarea

                className="ultra-auth__textarea"

                placeholder="Tell us about yourself..."

                value={form.bio}

                onChange={(e)=>
                  setForm({
                    ...form,
                    bio:e.target.value
                  })
                }

              />

              {
                errors.bio &&
                <span className="form-error">
                  {errors.bio}
                </span>
              }

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              className="ultra-auth__submit"
            >

              {
                loading
                  ? "Creating Identity..."
                  : "Launch AI Profile"
              }

            </button>

          </form>

        </div>

      </div>

    </div>
  );
}