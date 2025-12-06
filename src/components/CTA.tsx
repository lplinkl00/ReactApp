import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-800">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="mb-6 text-white">
          Ready to Get Started?
        </h2>
        <p className="mb-8 text-blue-100">
          Join thousands of satisfied customers and transform your business today. No credit card required.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-2">
            Start Your Free Trial
            <ArrowRight size={20} />
          </button>
          <button className="px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white/10 transition-colors">
            Schedule a Demo
          </button>
        </div>
      </div>
    </section>
  );
}
