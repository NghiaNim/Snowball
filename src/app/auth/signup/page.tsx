export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join Snowball
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connect with your tribe and grow your network
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-8">
          <p className="text-center text-gray-600">
            Authentication pages will be implemented in the next phase.
          </p>
          <p className="text-center text-gray-600 mt-4">
            This includes Supabase Auth integration with email/password and social login.
          </p>
        </div>
      </div>
    </div>
  )
}
