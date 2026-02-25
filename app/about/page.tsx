export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">About BM SP. Z O. O.</h1>

                <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        BM SP. Z O. O. is a leading Polish retail and wholesale business specializing in household items,
                        tools, and equipment. For years, we have been serving both individual consumers and business clients
                        with quality products and competitive pricing.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        Our mission is to provide a seamless shopping experience whether you&apos;re furnishing your home
                        or equipping your business with professional tools.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
                    <p className="text-gray-700 leading-relaxed">
                        To be the most trusted partner for household products and professional tools in Poland,
                        delivering exceptional value through quality products, competitive pricing, and outstanding
                        customer service to both retail and wholesale customers.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">What We Offer</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Household Products</h3>
                            <p className="text-gray-700 text-sm">
                                From kitchenware to cleaning supplies, we offer a comprehensive range of household items
                                for everyday living.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Tools</h3>
                            <p className="text-gray-700 text-sm">
                                High-quality hand tools, power tools, and equipment for professionals and DIY enthusiasts.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">B2C Retail</h3>
                            <p className="text-gray-700 text-sm">
                                Competitive retail pricing with VAT included for individual consumers shopping for their homes.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">B2B Wholesale</h3>
                            <p className="text-gray-700 text-sm">
                                Exclusive wholesale pricing and bulk order capabilities for business customers and contractors.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
                    <ul className="space-y-3">
                        <li className="flex items-start">
                            <svg className="h-6 w-6 text-green-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-700">Extensive product catalog with thousands of items in stock</span>
                        </li>
                        <li className="flex items-start">
                            <svg className="h-6 w-6 text-green-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-700">Competitive pricing for both retail and wholesale customers</span>
                        </li>
                        <li className="flex items-start">
                            <svg className="h-6 w-6 text-green-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-700">Fast shipping and reliable delivery across Poland</span>
                        </li>
                        <li className="flex items-start">
                            <svg className="h-6 w-6 text-green-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-700">Dedicated support team ready to help with your orders</span>
                        </li>
                        <li className="flex items-start">
                            <svg className="h-6 w-6 text-green-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-700">Quality guarantee on all our products</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
