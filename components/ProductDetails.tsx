'use client'

import type { Product, Category, Json } from '@/types/database.types'
import PriceDisplay from '@/components/PriceDisplay'
import AddToCartButton from '@/components/AddToCartButton'
import { useLocaleMessages } from '@/contexts/LocaleContext'
import {
    getLocalizedBrandName,
    getLocalizedCategoryNameWithTranslations,
    getLocalizedProductDescription,
    getLocalizedProductTitle,
} from '@/utils/productLocalization'
import { useProductTranslation } from '@/utils/useProductTranslation'
import React, { useState, useMemo } from 'react'

interface ProductDetailsProps {
    product: Product & { category: Category }
}

function sanitizeText(raw: string): string {
    return raw
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, '')
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '')
        .replace(/<li\b[^>]*>/gi, '\n- ')
        .replace(/<\/li>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|section|article|h[1-6])>/gi, '\n\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/(?:style|class|font-[a-zA-Z]+|color|size|face|bgcolor)="[^"]*"/gi, '')
        .replace(/([.!?a-z])\s*>\s*([A-Z])/g, '$1\n$2')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\r/g, '')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

function formatSentence(str: string): string {
    if (!str) return ''
    const alphaStr = str.replace(/[^A-Za-z]/g, '')
    if (alphaStr.length > 0 && alphaStr === alphaStr.toUpperCase()) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    }
    return str.charAt(0).toUpperCase() + str.slice(1)
}

function toTitleCase(str: string): string {
    if (!str) return ''
    return str.toLowerCase().split(' ').map(word => {
        if (word === 'faq') return 'FAQ'
        if (word.length > 0) {
            return word.charAt(0).toUpperCase() + word.slice(1)
        }
        return word
    }).join(' ')
}

function Accordion({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className="border-b border-slate-200 py-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between py-2 text-left focus:outline-none group"
            >
                <span className="text-[0.95rem] font-bold text-slate-800 group-hover:text-emerald-600 transition-colors tracking-wide">
                    {title}
                </span>
                <span className="ml-6 flex items-center">
                    <svg
                        className={`h-4 w-4 text-slate-400 transition-transform duration-300 ease-out ${isOpen ? '-rotate-180' : 'rotate-0'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>
            <div
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="pb-6 pt-2">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function ProductDetails({ product }: ProductDetailsProps) {
    const specifications = product.specifications as Record<string, Json> | null
    const { messages, locale } = useLocaleMessages()

    const baseLocalizedTitle = getLocalizedProductTitle(
        product.title,
        product.slug,
        locale,
        product.title_translations as { en?: string | null, pl?: string | null } | null
    )
    const baseLocalizedDescription = getLocalizedProductDescription(
        product.description,
        product.slug,
        locale,
        product.description_translations as { en?: string | null, pl?: string | null } | null
    )

    const { title: clientTranslatedTitle, description: clientTranslatedDescription } = useProductTranslation(
        product.title,
        product.description,
        product.title_translations as { en?: string | null, pl?: string | null } | null,
        product.description_translations as { en?: string | null, pl?: string | null } | null,
        locale
    )

    const localizedTitle = clientTranslatedTitle || baseLocalizedTitle
    const localizedDescription = clientTranslatedDescription || baseLocalizedDescription

    const localizedCategoryName = getLocalizedCategoryNameWithTranslations(
        product.category.name,
        product.category.slug,
        locale,
        product.category.name_translations as { en?: string | null, pl?: string | null } | null
    )
    const localizedBrandName = getLocalizedBrandName(product.brand, locale)

    const parsedBlocks = useMemo(() => {
        if (!localizedDescription) return [];
        const cleanText = sanitizeText(localizedDescription);
        const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);

        const blocks: { title: string, type: 'text' | 'features' | 'tags' | 'faq' | 'specs', items: string[] }[] = [];
        let currentTitle = messages.product.description;
        let currentType: 'text' | 'features' | 'tags' | 'faq' | 'specs' = 'text';
        let currentItems: string[] = [];

        const pushBlock = () => {
            if (currentItems.length > 0) {
                // Auto-detect key-value pairs for specifications table
                const colonsCount = currentItems.filter(i => i.replace(/^[-•]\s*/, '').includes(':')).length;
                const hasManyColons = colonsCount > 0 && colonsCount >= Math.floor(currentItems.length / 2);

                if (hasManyColons && currentType !== 'faq') {
                    currentType = 'specs';
                } else if (currentType === 'text') {
                    const isAllBullets = currentItems.every(i => i.startsWith('-') || i.startsWith('•'));
                    if (isAllBullets) currentType = 'features';
                    else {
                        const qCount = currentItems.filter(i => i.endsWith('?')).length;
                        if (qCount >= 2) currentType = 'faq';
                    }
                }
                blocks.push({ title: currentTitle, type: currentType, items: currentItems });
            }
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const nextLine = lines[i + 1];
            const nextIsBullet = nextLine && (nextLine.startsWith('-') || nextLine.startsWith('•'));

            if (/^(faq|frequently asked questions|pytania i odpowiedzi)/i.test(line)) {
                pushBlock();
                currentTitle = 'FAQ';
                currentType = 'faq';
                currentItems = [];
                continue;
            }

            if (/^(perfect for|ideal for|zastosowanie|idealne do)/i.test(line)) {
                pushBlock();
                currentTitle = line;
                currentType = 'tags';
                currentItems = [];
                continue;
            }

            if (line.endsWith('?') && nextIsBullet) {
                pushBlock();
                currentTitle = line;
                currentType = 'features';
                currentItems = [];
                continue;
            }

            if (line.length < 50 && !line.startsWith('-') && nextIsBullet) {
                pushBlock();
                currentTitle = line;
                currentType = 'features'; // Will be evaluated to 'specs' by pushBlock if it's mostly colons
                currentItems = [];
                continue;
            }

            currentItems.push(line);
        }
        pushBlock();

        return blocks;
    }, [localizedDescription, messages.product.description]);

    const specificationEntries = specifications
        ? Object.entries(specifications).filter(([key]) => !key.startsWith('source_'))
        : []

    const renderFaqBlock = (items: string[]) => {
        const pairs: { q: string, a: string }[] = [];
        let q = '', a = '';
        items.forEach(line => {
            if (line.endsWith('?') || /^(czy|is|does|how|why|what|are|will)\b/i.test(line)) {
                if (q) pairs.push({ q, a: a.trim() });
                q = line.replace(/^[-•]\s*/, '');
                a = '';
            } else {
                a += (a ? ' ' : '') + line;
            }
        });
        if (q) pairs.push({ q, a: a.trim() });

        return (
            <div className="space-y-4 pt-2">
                {pairs.map((pair, idx) => (
                    <div key={idx} className="bg-slate-50/60 rounded-xl p-5 border border-slate-100">
                        <h4 className="font-semibold text-slate-900 mb-2 leading-snug">{formatSentence(pair.q)}</h4>
                        <p className="text-[0.95rem] text-slate-600 leading-relaxed">{formatSentence(pair.a)}</p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col w-full max-w-2xl mx-auto lg:max-w-none">
            <div className="mb-8">
                {localizedCategoryName && (
                    <p className="text-xs font-semibold tracking-wider uppercase text-emerald-600 mb-3">
                        {localizedCategoryName}
                    </p>
                )}
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4 leading-tight">
                    {localizedTitle}
                </h1>
                {product.is_promotional && (
                    <span className="inline-flex mb-3 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                        {locale === 'pl' ? 'Promocja' : 'On Sale'}
                    </span>
                )}

                <div className="flex items-center gap-3 text-[13px] font-medium text-slate-500 uppercase tracking-widest">
                    {localizedBrandName && (
                        <span>{messages.product.brand}: <span className="text-slate-900">{localizedBrandName}</span></span>
                    )}
                    {localizedBrandName && product.sku && <span className="w-1 h-1 rounded-full bg-slate-300" />}
                    {product.sku && (
                        <span>{messages.product.sku}: <span className="text-slate-900">{product.sku}</span></span>
                    )}
                </div>
            </div>

            <div className="mb-10 p-6 bg-slate-50/80 border border-slate-100 rounded-2xl">
                <div className="mb-4">
                    <PriceDisplay
                        price_retail={Number(product.price_retail)}
                        price_wholesale={Number(product.price_wholesale)}
                        category={product.category}
                        showBreakdown
                    />
                </div>

                <div className="mb-6">
                    {product.inventory_count > 0 ? (
                        <div className="flex items-center gap-2.5 text-sm font-semibold text-emerald-600 bg-emerald-50 w-fit px-3 py-1.5 rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            {messages.product.inStock} ({product.inventory_count})
                        </div>
                    ) : (
                        <div className="flex items-center gap-2.5 text-sm font-semibold text-rose-600 bg-rose-50 w-fit px-3 py-1.5 rounded-full">
                            {messages.product.outOfStock}
                        </div>
                    )}
                </div>

                <AddToCartButton product={product} showQuantity className="w-full py-4 text-base font-semibold shadow-md shadow-slate-900/5 rounded-xl" />
            </div>

            <div className="border-t border-slate-200">
                {parsedBlocks.map((block, idx) => (
                    <Accordion key={`block-${idx}`} title={toTitleCase(block.title)} defaultOpen={idx === 0}>

                        {block.type === 'tags' && (
                            <div className="flex flex-wrap gap-2.5 pt-2">
                                {block.items.map((item, i) => (
                                    <span key={i} className="px-3.5 py-1.5 bg-slate-100/80 text-slate-700 text-sm rounded-full font-medium border border-slate-200/60">
                                        {formatSentence(item.replace(/^[-•]\s*/, ''))}
                                    </span>
                                ))}
                            </div>
                        )}

                        {block.type === 'features' && (
                            <ul className="space-y-3 pt-2">
                                {block.items.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="text-emerald-500 mt-0.5 shrink-0">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        </span>
                                        <span className="text-slate-600 text-[0.95rem] leading-relaxed">
                                            {formatSentence(item.replace(/^[-•]\s*/, ''))}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Renders parsed raw-text specifications as a clean table */}
                        {block.type === 'specs' && (
                            <div className="grid grid-cols-1 gap-y-0 pt-2 border border-slate-200/80 rounded-xl overflow-hidden shadow-sm bg-slate-50/40 divide-y divide-slate-100">
                                {block.items.map((item, i) => {
                                    const cleanItem = item.replace(/^[-•]\s*/, '');
                                    const colonIdx = cleanItem.indexOf(':');
                                    let key = cleanItem;
                                    let val = '';

                                    if (colonIdx > 0) {
                                        key = cleanItem.slice(0, colonIdx).trim();
                                        val = cleanItem.slice(colonIdx + 1).trim();
                                    }

                                    return (
                                        <div key={i} className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 transition-colors hover:bg-white">
                                            <span className="text-slate-500 font-medium sm:w-1/3 pr-4 capitalize">
                                                {formatSentence(key)}
                                            </span>
                                            {val && (
                                                <span className="text-sm text-slate-900 font-semibold sm:w-2/3">
                                                    {formatSentence(val)}
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {block.type === 'faq' && renderFaqBlock(block.items)}

                        {block.type === 'text' && (
                            <div className="space-y-4 pt-2">
                                {block.items.map((line, i) => (
                                    <p key={i} className="text-[0.95rem] text-slate-600 leading-relaxed">
                                        {formatSentence(line)}
                                    </p>
                                ))}
                            </div>
                        )}
                    </Accordion>
                ))}

                {/* Database-sourced specifications table */}
                {specificationEntries.length > 0 && (
                    <Accordion title={toTitleCase(messages.product.specifications)}>
                        <div className="grid grid-cols-1 gap-y-0 pt-2 border border-slate-200/80 rounded-xl overflow-hidden shadow-sm bg-white divide-y divide-slate-100">
                            {specificationEntries.map(([key, value]) => {
                                const formattedKey = key.replace(/_/g, ' ')
                                const rawVal = Array.isArray(value) ? value.join(', ') : String(value)
                                const formattedValue = formatSentence(rawVal)

                                return (
                                    <div key={key} className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 transition-colors hover:bg-slate-50/50">
                                        <span className="text-slate-500 font-medium sm:w-1/3 pr-4 capitalize">
                                            {formattedKey}
                                        </span>
                                        <span className="text-sm text-slate-900 font-semibold sm:w-2/3">
                                            {formattedValue}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </Accordion>
                )}

                <Accordion title="Shipping & Returns">
                    <p className="leading-relaxed text-[0.95rem] text-slate-600">
                        Shipping times may vary based on your location. Most items are dispatched within 24 hours. Returns are accepted within 30 days of delivery in their original packaging.
                    </p>
                </Accordion>
            </div>
        </div>
    )
}