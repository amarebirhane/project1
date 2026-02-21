import React from 'react'
import { render } from '@testing-library/react'
import ForecastPage from '@/app/forecast/page'

// Mock router to capture the redirect
const replaceMock = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}))

describe('ForecastPage', () => {
  it('redirects to forecast list', () => {
    render(<ForecastPage />)
    expect(replaceMock).toHaveBeenCalledWith('/forecast/list')
  })
})


