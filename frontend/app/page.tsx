import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { FeatureCard } from "@/components/feature-card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <HeroSection />

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three simple steps to split expenses and settle debts instantly
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="💰"
              title="Add Expenses"
              description="Track group expenses with smart splitting options. Support for equal splits, exact amounts, and percentages."
              delay={0}
            />
            <FeatureCard
              icon="🔄"
              title="Simplify Debts"
              description="Our algorithm automatically reduces complex debt webs into the minimum number of transfers needed."
              delay={0.1}
            />
            <FeatureCard
              icon="⚡"
              title="Settle with PYUSD"
              description="One-click settlement using PYUSD stablecoin on Ethereum. Fast, secure, and transparent."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose SplitPay?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon="🏦"
              title="No Bank Transfers"
              description="Skip slow bank transfers and fees. Settle instantly with crypto."
              delay={0}
            />
            <FeatureCard
              icon="🔐"
              title="ENS Support"
              description="Use ENS names like alice.eth instead of long wallet addresses."
              delay={0.1}
            />
            <FeatureCard
              icon="📱"
              title="Mobile Friendly"
              description="Fully responsive design that works perfectly on all devices."
              delay={0.2}
            />
            <FeatureCard
              icon="🎯"
              title="Smart Splitting"
              description="Advanced debt simplification reduces transfers by up to 80%."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Split Smarter?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of users who have simplified their group expenses
            with SplitPay.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="gradient-primary text-white px-8 py-3 rounded-lg text-lg font-semibold hover:shadow-lg transition-shadow">
              Get Started Free
            </button>
            <button className="border-2 border-green-500 text-green-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-50 transition-colors">
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold">SplitPay</span>
            </div>
            <p className="text-gray-400 mb-4">
              The future of group expense management
            </p>
            <p className="text-sm text-gray-500">
              Built for ETHGlobal hackathon • Powered by PYUSD on Ethereum
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
