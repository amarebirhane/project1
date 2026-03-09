import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";
import { useTranslations } from 'next-intl';
import styled from "styled-components";

const HeaderWrapper = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  background: radial-gradient(circle at 20% 20%, rgba(129, 140, 248, 0.12), transparent 32%),
    radial-gradient(circle at 80% 0%, rgba(59, 130, 246, 0.14), transparent 28%),
    rgba(6, 12, 24, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
`;

const Container = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  height: 70px;
  padding: 0 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const BrandLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
`;

const TitleFull = styled.span`
  font-weight: 800;
  font-size: 1.3rem;
  color: #e5e7eb;
  letter-spacing: -0.01em;
  transition: color 0.2s ease;
  display: none;

  @media (min-width: 640px) {
    display: inline;
  }

  &:hover {
    background-image: linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4);
    -webkit-background-clip: text;
    color: transparent;
  }
`;

const TitleShort = styled.span`
  font-weight: 800;
  font-size: 1.3rem;
  color: #e5e7eb;
  letter-spacing: -0.01em;
  transition: color 0.2s ease;

  @media (min-width: 640px) {
    display: none;
  }

  &:hover {
    background-image: linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4);
    -webkit-background-clip: text;
    color: transparent;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MobileNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  font-size: 0.95rem;
  font-weight: 700;

  @media (min-width: 640px) {
    display: none;
  }
`;

const MobileNavLink = styled(Link)`
  color: #e5e7eb;
  text-decoration: none;
  letter-spacing: -0.01em;
  transition: color 0.18s ease;

  &:hover {
    color: #c7d2fe;
  }
`;

const LoginButton = styled(Link)`
  padding: 9px 18px;
  border-radius: 999px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.35);
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;

  &:hover {
    transform: translateY(-1.5px);
    box-shadow: 0 14px 30px rgba(59, 130, 246, 0.45);
    opacity: 0.95;
  }

  &:active {
    transform: translateY(0);
  }
`;

export default function Header() {
  const t = useTranslations('Header');

  return (
    <HeaderWrapper>
      <Container>
        <BrandLink href="/">
          <div>
            <Image
              src="/log.png"
              alt={t('titleFull')}
              width={40}
              height={40}
            />
          </div>

          <TitleFull>{t('titleFull')}</TitleFull>
          <TitleShort>{t('titleShort')}</TitleShort>
        </BrandLink>

        <Actions>
          <MobileNav>
            <MobileNavLink href="/service/feature">{t('features')}</MobileNavLink>
            <MobileNavLink href="/service/price">{t('pricing')}</MobileNavLink>
            <MobileNavLink href="/service/docs">{t('docs')}</MobileNavLink>
            <MobileNavLink href="/service/contact">{t('contact')}</MobileNavLink>
          </MobileNav>
          <LoginButton href="/auth/login">{t('login')}</LoginButton>
        </Actions>
      </Container>
    </HeaderWrapper>
  );
}
