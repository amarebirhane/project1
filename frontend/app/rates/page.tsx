import React from 'react';

const plans = [
  {
    name: 'Starter',
    price: '$0',
    description: 'Perfect for side projects and hobbyists.',
    features: ['Up to 3 projects', 'Basic analytics', 'Community support'],
    buttonText: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    description: 'Everything you need to grow your business.',
    features: ['Unlimited projects', 'Advanced analytics', '24/7 Priority support', 'Custom domains'],
    buttonText: 'Buy Pro',
    highlight: true, // This adds a border or color to make it pop
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Advanced features for large-scale operations.',
    features: ['Dedicated account manager', 'SLA guarantees', 'SSO & Security', 'Custom contracts'],
    buttonText: 'Contact Sales',
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section className="bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Simple, Transparent Pricing
        </h2>
        <p className="mt-4 text-xl text-gray-600">
          Choose the plan that fits your needs. No hidden fees.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 max-w-7xl mx-auto">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`flex flex-col p-8 bg-white rounded-2xl border ${
              plan.highlight ? 'border-blue-500 shadow-xl scale-105' : 'border-gray-200'
            } transition-all duration-300`}
          >
            <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
            <p className="mt-4 text-gray-500 text-sm">{plan.description}</p>
            <p className="mt-8">
              <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
              {plan.price !== 'Custom' && <span className="text-gray-500 text-lg">/mo</span>}
            </p>

            <ul className="mt-8 space-y-4 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={`mt-10 block w-full py-3 px-6 border rounded-xl text-center font-semibold transition-colors ${
                plan.highlight
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-50 text-blue-700 hover:bg-gray-100'
              }`}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}