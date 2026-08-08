import React from "react";
import Navbar from "./Navbar";
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiTruck,
  FiShield,
  FiRotateCcw,
  FiFileText,
} from "react-icons/fi";

const About: React.FC = () => {
  const sections = [
    {
      icon: FiShield,
      title: "Privacy Policy",
      body: (
        <>
          <p className="mb-2 text-sm text-ink-600">
            We value your privacy and are committed to protecting your personal
            information. Here's what we collect:
          </p>
          <ul className="mb-2 list-disc pl-5 text-sm text-ink-600">
            <li>Personal details like name, email, phone number, and address.</li>
            <li>Payment details are encrypted and secure.</li>
            <li>Browsing data to enhance your shopping experience.</li>
          </ul>
          <p className="text-sm font-bold text-ink-800">
            We never sell or misuse your personal data.
          </p>
        </>
      ),
    },
    {
      icon: FiTruck,
      title: "Shipping Policy",
      body: (
        <p className="text-sm text-ink-600">
          We currently deliver across our market areas. Standard orders are
          processed within 1 hour, with express delivery available in select
          areas.
        </p>
      ),
    },
    {
      icon: FiRotateCcw,
      title: "Refund Policy",
      body: (
        <>
          <p className="mb-2 text-sm text-ink-600">
            We ensure a hassle-free return and refund policy:
          </p>
          <ul className="list-disc pl-5 text-sm text-ink-600">
            <li>
              Returns accepted within <strong>7 days</strong> for unused,
              original-packaged items.
            </li>
            <li>Perishable goods are non-returnable unless damaged.</li>
            <li>
              Refunds are processed within <strong>7 days</strong> to your
              original payment method.
            </li>
          </ul>
        </>
      ),
    },
    {
      icon: FiFileText,
      title: "Terms and Conditions",
      body: (
        <>
          <p className="mb-2 text-sm text-ink-600">
            By using our services, you agree to the following:
          </p>
          <ul className="list-disc pl-5 text-sm text-ink-600">
            <li>Users must be 18+ years old.</li>
            <li>Account and order details must be accurate.</li>
            <li>Unauthorized access or misuse of the platform is prohibited.</li>
            <li>Prices and availability are subject to change.</li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-cream-100 pb-20 md:pb-0">
      <Navbar active="account" />

      <main className="mx-auto max-w-4xl px-4">
        {/* ── Hero ── */}
        <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-cream-300 bg-gradient-to-br from-cream-200 via-cream-100 to-cream-300 px-6 py-10 shadow-arch sm:px-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-brand-300/30 blur-3xl" />

          <div className="relative">
            <p className="font-display text-sm italic text-accent-600">
              Our story
            </p>
            <h1 className="font-display mt-1 text-3xl font-black tracking-tight text-ink-800 sm:text-4xl lg:text-5xl">
              About ZipMart
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-600 sm:text-base">
              Welcome to <strong className="text-ink-800">ZipMart</strong>, your
              one-stop destination for groceries, essentials, and daily needs.
              Our mission is to provide high-quality products with speed and
              convenience — zipped right to your doorstep in minutes.
            </p>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-600 sm:text-base">
              At <strong className="text-ink-800">ZipMart</strong>, we believe in
              making everyday life easier by partnering with trusted brands and
              local suppliers to ensure freshness, reliability, and customer
              satisfaction.
            </p>
          </div>
        </section>

        {/* ── Policy cards ── */}
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {sections.map(({ icon: Icon, title, body }) => (
            <section
              key={title}
              className="rounded-3xl border border-cream-300 bg-cream-50 p-6 shadow-arch"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="arch-frame flex h-10 w-10 shrink-0 items-center justify-center bg-brand-100 text-brand-700">
                  <Icon size={18} />
                </div>
                <h2 className="font-display text-xl font-bold text-ink-800">
                  {title}
                </h2>
              </div>
              {body}
            </section>
          ))}
        </div>

        {/* ── Contact Us ── */}
        <section className="mt-8 rounded-[2rem] bg-gradient-to-r from-ink-800 to-brand-800 p-7 text-cream-100 shadow-arch sm:p-9">
          <p className="font-display text-sm italic text-accent-300">
            Questions? Say hello
          </p>
          <h2 className="font-display mt-0.5 text-2xl font-bold text-cream-50">
            Contact Us
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-2xl bg-cream-50/10 p-4 backdrop-blur-sm">
              <FiMapPin className="mt-0.5 shrink-0 text-accent-300" />
              <p className="text-sm text-cream-100">
                74, Lahodda, Khatauli, Muzaffarnagar, Uttar Pradesh - 251201
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-cream-50/10 p-4 backdrop-blur-sm">
              <FiPhone className="mt-0.5 shrink-0 text-accent-300" />
              <p className="text-sm text-cream-100">+91-7310851792</p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-cream-50/10 p-4 backdrop-blur-sm">
              <FiMail className="mt-0.5 shrink-0 text-accent-300" />
              <a
                href="mailto:hello@duforge.tech"
                className="text-sm font-semibold text-cream-100 hover:underline"
              >
                hello@duforge.tech
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;
