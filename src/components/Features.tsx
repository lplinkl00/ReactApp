import { Zap, Shield, Users, TrendingUp, Clock, Award } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Experience blazing fast performance with our optimized infrastructure and technology.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Your data is protected with enterprise-grade security and 99.9% uptime guarantee.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work seamlessly with your team using powerful collaboration tools and features.",
  },
  {
    icon: TrendingUp,
    title: "Scale with Ease",
    description: "Grow your business without limits. Our platform scales as you grow.",
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Get help whenever you need it with our round-the-clock customer support team.",
  },
  {
    icon: Award,
    title: "Award Winning",
    description: "Recognized by industry leaders for excellence in innovation and customer satisfaction.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full mb-4">
            Features
          </div>
          <h2 className="mb-4 text-gray-900">
            Everything You Need to Succeed
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to help you achieve your goals faster and more efficiently.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="text-blue-600" size={24} />
              </div>
              <h3 className="mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
