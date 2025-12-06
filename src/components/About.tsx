import { CheckCircle2 } from "lucide-react";

const benefits = [
  "Trusted by over 10,000+ companies worldwide",
  "Industry-leading customer satisfaction ratings",
  "Continuous innovation and feature updates",
  "Comprehensive onboarding and training resources",
];

export function About() {
  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwY29sbGFib3JhdGlvbnxlbnwxfHx8fDE3NjUwMDgwODJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Team collaboration"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Text Content */}
          <div className="order-1 lg:order-2">
            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full mb-4">
              About Us
            </div>
            <h2 className="mb-6 text-gray-900">
              Empowering Businesses Since 2015
            </h2>
            <p className="mb-6 text-gray-600">
              We're passionate about helping businesses thrive in the digital age. Our mission is to provide innovative solutions that make a real difference.
            </p>
            <p className="mb-8 text-gray-600">
              With years of experience and a dedicated team of experts, we've built a platform that combines power with simplicity, helping thousands of companies achieve their goals.
            </p>

            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
