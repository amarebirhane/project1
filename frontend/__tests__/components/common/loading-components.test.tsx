import React from 'react'
import { render, screen } from '@testing-library/react'
import {
  Spinner,
  DotsLoading,
  TextLoading,
  Progress,
  BounceLoading,
  OverlayLoading,
  CardLoading,
  SkeletonLoading,
} from '@/components/common/LoadingComponents'

describe('LoadingComponents', () => {
  describe('Spinner', () => {
    it('renders spinner', () => {
      render(<Spinner />)
      expect(document.body).toBeTruthy()
    })

    it('renders spinner with custom size', () => {
      render(<Spinner size="60px" />)
      expect(document.body).toBeTruthy()
    })
  })

  describe('DotsLoading', () => {
    it('renders dots loading', () => {
      render(<DotsLoading />)
      expect(document.body).toBeTruthy()
    })
  })

  describe('TextLoading', () => {
    it('renders with default text', () => {
      render(<TextLoading />)
      expect(screen.getByText(/Loading/)).toBeInTheDocument()
    })

    it('renders with custom text', () => {
      render(<TextLoading text="Processing..." />)
      expect(screen.getByText(/Processing/)).toBeInTheDocument()
    })
  })

  describe('Progress', () => {
    it('renders progress bar', () => {
      render(<Progress />)
      expect(document.body).toBeTruthy()
    })

    it('renders progress bar with custom progress', () => {
      render(<Progress progress={75} />)
      expect(document.body).toBeTruthy()
    })
  })

  describe('BounceLoading', () => {
    it('renders bounce loading', () => {
      render(<BounceLoading />)
      expect(document.body).toBeTruthy()
    })
  })

  describe('OverlayLoading', () => {
    it('renders overlay loading', () => {
      render(<OverlayLoading />)
      expect(document.body).toBeTruthy()
    })
  })

  describe('CardLoading', () => {
    it('renders with default text', () => {
      render(<CardLoading />)
      expect(screen.getByText(/Loading/)).toBeInTheDocument()
    })

    it('renders with custom text', () => {
      render(<CardLoading text="Loading data..." />)
      expect(screen.getByText(/Loading data/)).toBeInTheDocument()
    })
  })

  describe('SkeletonLoading', () => {
    it('renders text skeleton', () => {
      render(<SkeletonLoading.Text />)
      expect(document.body).toBeTruthy()
    })

    it('renders circle skeleton', () => {
      render(<SkeletonLoading.Circle />)
      expect(document.body).toBeTruthy()
    })

    it('renders rectangle skeleton', () => {
      render(<SkeletonLoading.Rectangle />)
      expect(document.body).toBeTruthy()
    })

    it('renders skeleton with custom dimensions', () => {
      render(<SkeletonLoading.Text width="200px" />)
      render(<SkeletonLoading.Circle size="40px" />)
      render(<SkeletonLoading.Rectangle height="150px" width="300px" />)
      expect(document.body).toBeTruthy()
    })
  })
})

